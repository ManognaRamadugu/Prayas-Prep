
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ApiTestPage() {
  const [result, setResult] = useState("Not tested yet");
  const [loading, setLoading] = useState(false);

  async function testGrades() {
    setLoading(true);
    setResult("Testing API...");

    try {
      const supabase = createClient();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setResult("No active login session. Please log in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cms/grades`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      const data = await response.json();

      setResult(
        `HTTP ${response.status}\n\n${JSON.stringify(data, null, 2)}`
      );
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }
async function testExams() {
  setLoading(true);
  setResult("Loading exams...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/exams`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();
    setResult(`HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testCurricula() {
  setLoading(true);
  setResult("Loading curricula...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const examId = "6ae08961-737d-493e-a7f6-2107474aa11e";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/curricula?examId=${examId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setResult(
      `HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`
    );
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testFoundationGrades() {
  setLoading(true);
  setResult("Loading Foundation grades...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const curriculumId = "0135d4e6-540b-4679-9c4a-2bec54d8459d";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/grades?curriculumId=${curriculumId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setResult(
      `HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`
    );
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testJeeCurriculum() {
  setLoading(true);
  setResult("Loading JEE curriculum...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const examId = "32c26d37-8530-432f-b814-c2ba3fccc388";
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/curricula?examId=${examId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();
    setResult(`HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testNeetCurriculum() {
  setLoading(true);
  setResult("Loading NEET curriculum...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const examId = "32c26d37-8530-432f-b814-c2ba3fccc388";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/curricula?examId=${examId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setResult(
      `HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`
    );
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testNeetGrades() {
  setLoading(true);
  setResult("Loading NEET grades...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const curriculumId = "393153c5-564a-4401-aac8-aceca77f7595";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/grades?curriculumId=${curriculumId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setResult(`HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}

async function testEamcetCurriculum() {
  setLoading(true);
  setResult("Loading EAMCET curriculum...");

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setResult("Please log in again.");
      return;
    }

    const examId = "3648f99b-4030-471f-ac3a-5863611d5c08";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cms/curricula?examId=${examId}`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();
    setResult(`HTTP ${response.status}\n\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    setResult(String(error));
  } finally {
    setLoading(false);
  }
}




  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Prayas Prep API Test</h1>

        <p className="mt-2 text-slate-600">
          Test the grade API using your existing Super Admin session.
        </p>

        <button
          onClick={testGrades}
          disabled={loading}
          className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Grades API"}
        </button>
       <button
  onClick={testExams}
  disabled={loading}
  className="ml-3 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white"
>
  Test Exams API
</button>
<button
  onClick={testCurricula}
  disabled={loading}
  className="ml-3 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white"
>
  Test Curricula API
</button>
<button
  onClick={testFoundationGrades}
  disabled={loading}
  className="ml-3 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white"
>
  Test Foundation Grades
</button>
<button onClick={testJeeCurriculum} disabled={loading}>
  Test JEE Curriculum
</button>
<button onClick={testNeetCurriculum} disabled={loading}>
  Test NEET Curriculum
</button>
<button onClick={testNeetGrades} disabled={loading}>
  Test NEET Grades
</button>
<button onClick={testEamcetCurriculum} disabled={loading}>
  Test EAMCET Curriculum
</button>
        <pre className="mt-6 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-green-300">
          {result}
        </pre>
      </div>
    </main>
  );
}
