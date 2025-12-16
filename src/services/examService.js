const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token từ localStorage
function getToken() {
  return localStorage.getItem("token") || "";
}

// Hàm lấy headers Authorization
function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Lấy số lượng đề thi theo level
export async function getExamCountByLevel() {
  const response = await fetch(`${BASE_URL}/exams/count-by-level`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get exam count: ${response.statusText}`);
  }

  return response.json();
}

export async function getExamsByLevel(level) {
  const response = await fetch(`${BASE_URL}/exams/level/${level}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get exams for level ${level}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function getExamDetail(id) {
  const response = await fetch(`${BASE_URL}/exams/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get exams with id ${id}: ${response.statusText}`
    );
  }
  return response.json();
}

// Bắt đầu làm bài
export async function startExam(examId) {
  const response = await fetch(`${BASE_URL}/exam-results/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ examId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start exam: ${response.statusText}`);
  }

  return response.json();
}

// Nộp bài, tính điểm
export async function submitExam(examResultId) {
  const response = await fetch(`${BASE_URL}/exam-results/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ examResultId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit exam: ${response.statusText}`);
  }

  return response.json();
}


// Tiếp tục bài thi đang làm dở
export async function resumeExam(examResultId) {
  const response = await fetch(`${BASE_URL}/exam-results/resume/${examResultId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resume exam: ${response.statusText}`);
  }

  return response.json();
}



// {
//   examResultId: string,
//   partId: string,
//   answers: [
//     {
//       questionId: string,
//       subAnswers: [
//         {
//           subQuestionIndex: number,
//           selectedAnswer: number
//         }
//       ]
//     }
//   ]
// }

// Lưu đáp án khi làm bài
export async function saveAnswers(body) {
  const response = await fetch(`${BASE_URL}/exam-user-answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(), // gửi token JWT
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to save answers: ${response.statusText}`);
  }

  return response.json();
}

// Kiểm tra trạng thái làm bài của user với exam
export async function checkExamStatus(examId) {
  const response = await fetch(`${BASE_URL}/exam-results/status/${examId}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exam status");
  }

  return await response.json();
}

// Lấy kết quả bài thi
export async function checkExamResult(examId) {
  const response = await fetch(`${BASE_URL}/exam-results/${examId}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exam status");
  }

  return await response.json();
}

export async function comparisonUserAnswerWithResult(examId) {
  const response = await fetch(`${BASE_URL}/exam-results/comparison/${examId}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exam status");
  }

  return await response.json();
}

// Tạo đề thi mới
export async function createExam(data) {
  const response = await fetch(`${BASE_URL}/exams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create exam: ${err}`);
  }

  return response.json();
}

export async function updateExam(id, data) {
  const response = await fetch(`${BASE_URL}/exams/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update exam: ${err}`);
  }

  return response.json();
}


// Thêm câu hỏi vào part
export async function createExamQuestion(partId, data) {
  const response = await fetch(`${BASE_URL}/exam-questions/${partId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create exam question: ${err}`);
  }

  return response.json();
}

// Update exam question
export async function updateExamQuestion(questionId, data) {
  const response = await fetch(`${BASE_URL}/exam-questions/update/${questionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update exam question: ${err}`);
  }

  return response.json();
}

// Delete exam question
export async function deleteExamQuestion(questionId) {
  const response = await fetch(`${BASE_URL}/exam-questions/${questionId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to delete exam question: ${err}`);
  }

  return response.json();
}


