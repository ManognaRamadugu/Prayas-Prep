
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class StudentAccountsService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SECRET_KEY');

    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend environment.',
      );
    }

    this.supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async resolveStudentLoginEmail(
    usernameInput: string,
  ): Promise<{ email: string }> {
    const username = usernameInput.trim();

    const { data: student, error } = await this.supabase
      .from('school_students')
      .select('id, linked_user_id, status')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to verify student login details.',
      );
    }

    if (
      !student ||
      !student.linked_user_id ||
      student.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Invalid username or password.',
      );
    }

    return {
      email: `student-${student.id}@students.prayasprep.invalid`,
    };
  }


  async generateActivationCsv(
  accessToken: string,
  studentIds: string[],
  requestedSchoolId?: string,
): Promise<string> {
    if (!accessToken) {
      throw new UnauthorizedException('Please log in first.');
    }

    // 1. Verify the actual Supabase user.
    const { data: authData, error: authError } =
      await this.supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      throw new UnauthorizedException(
        'Your login session is invalid.',
      );
    }

    const userId = authData.user.id;

    // 2. Retrieve the user's actual platform roles.
    const { data: roleRows, error: roleError } =
      await this.supabase
        .from('user_roles')
        .select('roles!inner(name)')
        .eq('user_id', userId);

    if (roleError) {
      throw new InternalServerErrorException(
        'Unable to verify your platform role.',
      );
    }

    const roleNames = (roleRows ?? []).map((row: any) =>
      row.roles?.name,
    );

    const isSuperAdmin = roleNames.includes('SUPER_ADMIN');
    const isSchoolAdmin = roleNames.includes('SCHOOL_ADMIN');
    const isStudent = roleNames.includes('STUDENT');

    if (isStudent || (!isSuperAdmin && !isSchoolAdmin)) {
      throw new ForbiddenException(
        'Your account cannot generate student activation codes.',
      );
    }

    // 3. Resolve the school according to the user's role.
    let schoolId: string;

    if (isSuperAdmin) {
      if (!requestedSchoolId) {
        throw new BadRequestException(
          'SUPER_ADMIN must select a school.',
        );
      }

      schoolId = requestedSchoolId;
    } else {
      if (requestedSchoolId) {
        throw new ForbiddenException(
          'School administrators cannot select another school.',
        );
      }

      const { data: memberships, error: membershipError } =
        await this.supabase
          .from('school_memberships')
          .select('school_id')
          .eq('user_id', userId)
          .eq('membership_role', 'SCHOOL_ADMIN')
          .eq('status', 'ACTIVE');

      if (membershipError) {
  console.error('School membership query failed:', {
    message: membershipError.message,
    code: membershipError.code,
    details: membershipError.details,
    hint: membershipError.hint,
  });

  throw new InternalServerErrorException(
    'Unable to verify school membership.',
  );
}

      if (!memberships || memberships.length !== 1) {
        throw new ForbiddenException(
          'Your account must belong to exactly one active school.',
        );
      }

      schoolId = memberships[0].school_id;
    }

    // 4. Verify that the selected school exists and is active.
    const { data: school, error: schoolError } =
      await this.supabase
        .from('schools')
        .select('id, status')
        .eq('id', schoolId)
        .maybeSingle();

    if (schoolError) {
  console.error('School verification query failed:', {
    message: schoolError.message,
    code: schoolError.code,
    details: schoolError.details,
    hint: schoolError.hint,
  });

  throw new InternalServerErrorException(
    'Unable to verify the selected school.',
  );
}

    if (!school || school.status !== 'ACTIVE') {
      throw new BadRequestException(
        'The selected school does not exist or is inactive.',
      );
    }

   // 5. Load only the students inserted by this upload.
if (!studentIds || studentIds.length === 0) {
  throw new BadRequestException(
    'At least one student ID is required.',
  );
}

const uniqueStudentIds = [...new Set(studentIds)];

if (uniqueStudentIds.length !== studentIds.length) {
  throw new BadRequestException(
    'Duplicate student IDs were supplied.',
  );
}

const { data: students, error: studentError } =
  await this.supabase
    .from('school_students')
    .select('id, roll_number, full_name, username')
    .eq('school_id', schoolId)
    .eq('status', 'ACTIVE')
    .is('linked_user_id', null)
    .in('id', uniqueStudentIds);

if (studentError) {
  throw new InternalServerErrorException(
    'Unable to load uploaded students.',
  );
}

if (!students || students.length !== uniqueStudentIds.length) {
  throw new BadRequestException(
    'Some requested students do not exist, are inactive, are already linked, or do not belong to your school.',
  );
}

for (const student of students) {
  if (!student.username?.trim()) {
    throw new BadRequestException(
      `A username is missing for student roll number ${student.roll_number}.`,
    );
  }
}

    // 6. Validate usernames before issuing credentials.
    for (const student of students) {
      if (!student.username?.trim()) {
        throw new BadRequestException(
          `A username is missing for student roll number ${student.roll_number}.`,
        );
      }
    }

    // 7. Generate secure, random activation codes.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const generated: Array<{
      student: (typeof students)[number];
      code: string;
      hash: string;
    }> = [];

    const seenCodes = new Set<string>();

    for (const student of students) {
      let code: string;

      do {
        const raw = randomBytes(8).toString('hex').toUpperCase();
        code =
          `${raw.slice(0, 4)}-${raw.slice(4, 8)}-` +
          `${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
      } while (seenCodes.has(code));

      seenCodes.add(code);

      generated.push({
        student,
        code,
        hash: createHash('sha256')
          .update(code)
          .digest('hex'),
      });
    }

    // 8. Issue codes through the atomic database function.
    const { error: issueError } = await this.supabase.rpc(
      'issue_student_activation_codes',
      {
        p_school_id: schoolId,
        p_created_by: userId,
        p_expires_at: expiresAt,
        p_codes: generated.map(({ student, hash }) => ({
          student_id: student.id,
          code_hash: hash,
        })),
      },
    );

    if (issueError) {
      console.error(
        'Activation code issuance failed:',
        issueError,
      );

      throw new InternalServerErrorException(
        'Unable to issue activation codes.',
      );
    }

    // 9. Build the CSV. Original codes are returned only here.
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = [
      'School ID',
      'Roll Number',
      'Student Name',
      'Username',
      'Activation Code',
      'Expires At (UTC)',
    ];

    const lines = [
      header.map(escapeCsv).join(','),
      ...generated.map(({ student, code }) =>
        [
          schoolId,
          student.roll_number,
          student.full_name,
          student.username,
          code,
          expiresAt,
        ]
          .map(escapeCsv)
          .join(','),
      ),
    ];

    return '\uFEFF' + lines.join('\r\n');
  }

  async activateStudentAccount(input: {
    username: string;
    activationCode: string;
    password: string;
    email?: string;
  }): Promise<{ message: string; username: string }> {
    const username = input.username.trim().toLowerCase();
    const code = input.activationCode.trim().toUpperCase();

    const codeHash = createHash('sha256')
      .update(code)
      .digest('hex');

    const invalidMessage =
      'Activation details are invalid, expired, or already used.';

    // 1. Find the activation code.
    const { data: activation, error: activationError } =
      await this.supabase
        .from('student_activation_codes')
        .select(
          'id, school_id, student_id, expires_at, used_at, revoked_at, failed_attempts',
        )
        .eq('code_hash', codeHash)
        .maybeSingle();

    if (activationError) {
      console.error('Activation lookup failed:', activationError);
      throw new InternalServerErrorException(
        'Unable to verify activation details.',
      );
    }

    if (
      !activation ||
      activation.used_at ||
      activation.revoked_at ||
      new Date(activation.expires_at).getTime() <= Date.now() ||
      activation.failed_attempts >= 5
    ) {
      throw new BadRequestException(invalidMessage);
    }

    // 2. Find the student associated with this code.
    const { data: student, error: studentError } =
      await this.supabase
        .from('school_students')
        .select('id, full_name, username, status, linked_user_id')
        .eq('id', activation.student_id)
        .eq('school_id', activation.school_id)
        .maybeSingle();

    if (studentError) {
      console.error('Student lookup failed:', studentError);
      throw new InternalServerErrorException(
        'Unable to verify student details.',
      );
    }

    if (
      !student ||
      student.status !== 'ACTIVE' ||
      student.linked_user_id
    ) {
      throw new BadRequestException(invalidMessage);
    }

    // 3. Validate the username before creating an Auth account.
    if (
      !student.username ||
      student.username.trim().toLowerCase() !== username
    ) {
      const { error: attemptError } = await this.supabase.rpc(
        'record_student_activation_failure',
        { p_code_hash: codeHash },
      );

      if (attemptError) {
        console.error(
          'Failed to record activation attempt:',
          attemptError,
        );

        throw new InternalServerErrorException(
          'Unable to process activation.',
        );
      }

      throw new BadRequestException(invalidMessage);
    }

    // 4. Generate a domain-independent internal Auth email.
    // This is NOT the student's contact email.
    const internalEmail =
      `student-${student.id}@students.prayasprep.invalid`;

    // 5. Create the Supabase Auth account.
    const { data: authData, error: authError } =
  await this.supabase.auth.admin.createUser({
    email: internalEmail,
    password: input.password,
    email_confirm: true,

    user_metadata: {
      full_name: student.full_name,
    },

    app_metadata: {
      provisioning_source: 'student_activation',
      student_id: student.id,
    },
  });
    if (authError || !authData.user) {
      console.error('Student Auth account creation failed:', authError);

      throw new BadRequestException(
        'Unable to create the student account. Please contact your school administrator.',
      );
    }

    const newUserId = authData.user.id;

    // 6. Redeem the code and link the student.
    const { data: redemptionResult, error: redemptionError } =
      await this.supabase.rpc(
        'redeem_student_activation_code',
        {
          p_code_hash: codeHash,
          p_username: username,
          p_user_id: newUserId,
          p_contact_email: input.email?.trim() || null,
        },
      );

    if (redemptionError || redemptionResult !== 'SUCCESS') {
      // Delete only the Auth account created by this request.
      const { error: cleanupError } =
        await this.supabase.auth.admin.deleteUser(newUserId);

      if (cleanupError) {
        console.error(
          'Failed to clean up unactivated Auth account:',
          cleanupError,
        );
      }

      if (redemptionError) {
        console.error(
          'Student activation redemption failed:',
          redemptionError,
        );

        throw new InternalServerErrorException(
          'Unable to complete student activation.',
        );
      }

      throw new BadRequestException(invalidMessage);
    }

    return {
      message: 'Student account activated successfully.',
      username,
    };
  }

}
