
CREATE OR REPLACE FUNCTION public.bulk_import_questions(
    p_questions jsonb,
    p_created_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item jsonb;
    v_question_id uuid;
    v_topic_id uuid;
    v_option jsonb;
    v_option_order integer;
    v_correct_count integer;
    v_option_count integer;
    v_type public.question_type;
    v_imported_ids uuid[] := ARRAY[]::uuid[];
    v_imported_count integer := 0;
BEGIN
    -- Validate batch
    IF p_questions IS NULL THEN
        RAISE EXCEPTION 'Questions are required.';
    END IF;

    IF jsonb_typeof(p_questions) <> 'array' THEN
        RAISE EXCEPTION 'Questions must be an array.';
    END IF;

    IF jsonb_array_length(p_questions) = 0 THEN
        RAISE EXCEPTION 'At least one question is required.';
    END IF;

    IF jsonb_array_length(p_questions) > 500 THEN
        RAISE EXCEPTION 'Maximum 500 questions per import.';
    END IF;

    IF p_created_by IS NULL THEN
        RAISE EXCEPTION 'Created-by user is required.';
    END IF;

    -- Process each question
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_questions)
    LOOP
        IF jsonb_typeof(v_item) <> 'object' THEN
            RAISE EXCEPTION 'Each question must be a JSON object.';
        END IF;

        IF NULLIF(trim(v_item->>'question_text'), '') IS NULL THEN
            RAISE EXCEPTION 'Question text is required.';
        END IF;

        -- Question type
        IF v_item->>'question_type' NOT IN (
            'SINGLE_CHOICE',
            'MULTIPLE_CHOICE',
            'NUMERICAL',
            'TRUE_FALSE'
        ) THEN
            RAISE EXCEPTION 'Invalid or missing question type.';
        END IF;

        v_type := (v_item->>'question_type')::public.question_type;

        -- Difficulty
        IF v_item->>'difficulty' NOT IN (
            'EASY',
            'MEDIUM',
            'HARD'
        ) THEN
            RAISE EXCEPTION 'Invalid or missing difficulty.';
        END IF;

        -- Source type
        IF COALESCE(v_item->>'source_type', 'IMPORTED') NOT IN (
            'VERIFIED',
            'IMPORTED',
            'PREVIOUS_YEAR',
            'TEACHER_CREATED'
        ) THEN
            RAISE EXCEPTION
                'Invalid source type. AI_GENERATED is not allowed.';
        END IF;

        -- Marks
        IF COALESCE((v_item->>'marks')::numeric, 1) < 0
           OR COALESCE((v_item->>'negative_marks')::numeric, 0) < 0 THEN
            RAISE EXCEPTION 'Marks cannot be negative.';
        END IF;

        -- Topic validation
        IF jsonb_typeof(v_item->'topic_ids') IS DISTINCT FROM 'array' THEN
            RAISE EXCEPTION 'Topic IDs must be an array.';
        END IF;

        IF jsonb_array_length(v_item->'topic_ids') = 0 THEN
            RAISE EXCEPTION 'At least one topic is required.';
        END IF;

        -- Choice question validation
        IF v_type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE') THEN

            IF jsonb_typeof(v_item->'options') IS DISTINCT FROM 'array' THEN
                RAISE EXCEPTION 'Options are required.';
            END IF;

            SELECT
                count(*),
                count(*) FILTER (
                    WHERE COALESCE((value->>'is_correct')::boolean, false)
                )
            INTO v_option_count, v_correct_count
            FROM jsonb_array_elements(v_item->'options');

            IF v_option_count < 2 OR v_correct_count = 0 THEN
                RAISE EXCEPTION
                    'At least two options and one correct answer are required.';
            END IF;

            IF v_type = 'SINGLE_CHOICE'
               AND v_correct_count <> 1 THEN
                RAISE EXCEPTION
                    'Single-choice questions require exactly one correct answer.';
            END IF;

        ELSE
            IF NULLIF(trim(v_item->>'answer_text'), '') IS NULL THEN
                RAISE EXCEPTION 'An answer is required.';
            END IF;
        END IF;

        -- Insert question as inactive draft
        INSERT INTO public.questions (
            question_text,
            question_type,
            difficulty,
            source_type,
            explanation,
            hint,
            marks,
            negative_marks,
            tags,
            is_group_question,
            status,
            is_active,
            created_by
        )
        VALUES (
            trim(v_item->>'question_text'),
            v_type,
            (v_item->>'difficulty')::public.question_difficulty,
            COALESCE(
                NULLIF(v_item->>'source_type', ''),
                'IMPORTED'
            )::public.question_source,
            NULLIF(v_item->>'explanation', ''),
            NULLIF(v_item->>'hint', ''),
            COALESCE((v_item->>'marks')::numeric, 1),
            COALESCE((v_item->>'negative_marks')::numeric, 0),
            ARRAY(
                SELECT jsonb_array_elements_text(
                    COALESCE(v_item->'tags', '[]'::jsonb)
                )
            ),
            COALESCE((v_item->>'is_group_question')::boolean, false),
            'DRAFT',
            false,
            p_created_by
        )
        RETURNING id INTO v_question_id;

        -- Insert options or answer
        IF v_type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE') THEN
            v_option_order := 0;

            FOR v_option IN
                SELECT value
                FROM jsonb_array_elements(v_item->'options')
            LOOP
                IF jsonb_typeof(v_option) <> 'object' THEN
                    RAISE EXCEPTION 'Each option must be an object.';
                END IF;

                IF NULLIF(trim(v_option->>'option_text'), '') IS NULL THEN
                    RAISE EXCEPTION 'Option text cannot be empty.';
                END IF;

                v_option_order := v_option_order + 1;

                INSERT INTO public.question_options (
                    question_id,
                    option_text,
                    option_order,
                    is_correct
                )
                VALUES (
                    v_question_id,
                    trim(v_option->>'option_text'),
                    v_option_order,
                    COALESCE(
                        (v_option->>'is_correct')::boolean,
                        false
                    )
                );
            END LOOP;

        ELSE
            INSERT INTO public.question_answers (
                question_id,
                answer_text
            )
            VALUES (
                v_question_id,
                trim(v_item->>'answer_text')
            );
        END IF;

        -- Insert topic mappings
        FOR v_topic_id IN
            SELECT DISTINCT value::uuid
            FROM jsonb_array_elements_text(v_item->'topic_ids')
        LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM public.topics
                WHERE id = v_topic_id
            ) THEN
                RAISE EXCEPTION 'Invalid topic ID: %', v_topic_id;
            END IF;

            INSERT INTO public.question_topics (
                question_id,
                topic_id
            )
            VALUES (
                v_question_id,
                v_topic_id
            );
        END LOOP;

        v_imported_count := v_imported_count + 1;
        v_imported_ids := array_append(
            v_imported_ids,
            v_question_id
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'imported_count', v_imported_count,
        'question_ids', to_jsonb(v_imported_ids)
    );
END;
$$;

-- Restrict execution to the backend service role
REVOKE ALL ON FUNCTION public.bulk_import_questions(jsonb, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.bulk_import_questions(jsonb, uuid)
TO service_role;
