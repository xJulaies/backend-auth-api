type ApiResponse<T = unknown> = {
  status: number;
  message: string;
  data: T[];
};

type LoginResponseData = {
  accessToken?: string;
  refreshToken?: string;
};

const baseUrlInput = document.querySelector<HTMLInputElement>("#baseUrl");
const registerForm = document.querySelector<HTMLFormElement>("#registerForm");
const loginForm = document.querySelector<HTMLFormElement>("#loginForm");
const makeAdminForm = document.querySelector<HTMLFormElement>("#makeAdminForm");
const meButton = document.querySelector<HTMLButtonElement>("#meButton");
const refreshButton =
  document.querySelector<HTMLButtonElement>("#refreshButton");
const logoutButton = document.querySelector<HTMLButtonElement>("#logoutButton");
const clearTokensButton =
  document.querySelector<HTMLButtonElement>("#clearTokensButton");
const accessTokenTextarea =
  document.querySelector<HTMLTextAreaElement>("#accessToken");
const refreshTokenTextarea =
  document.querySelector<HTMLTextAreaElement>("#refreshToken");
const responseOutput = document.querySelector<HTMLElement>("#responseOutput");

if (
  !baseUrlInput ||
  !registerForm ||
  !loginForm ||
  !makeAdminForm ||
  !meButton ||
  !refreshButton ||
  !logoutButton ||
  !clearTokensButton ||
  !accessTokenTextarea ||
  !refreshTokenTextarea ||
  !responseOutput
) {
  throw new Error("Required DOM elements are missing.");
}

let accessToken = "";
let refreshToken = "";

const setTokens = (tokens: { accessToken?: string; refreshToken?: string }) => {
  if (typeof tokens.accessToken === "string") {
    accessToken = tokens.accessToken;
    accessTokenTextarea.value = accessToken;
  }

  if (typeof tokens.refreshToken === "string") {
    refreshToken = tokens.refreshToken;
    refreshTokenTextarea.value = refreshToken;
  }
};

const clearTokens = () => {
  accessToken = "";
  refreshToken = "";
  accessTokenTextarea.value = "";
  refreshTokenTextarea.value = "";
};

const getBaseUrl = (): string => {
  return baseUrlInput.value.trim().replace(/\/$/, "");
};

const renderResponse = (payload: unknown) => {
  responseOutput.textContent = JSON.stringify(payload, null, 2);
};

const parseForm = (form: HTMLFormElement): Record<string, string> => {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries()) as Record<string, string>;
};

const ensureAccessToken = (): boolean => {
  if (!accessToken.trim()) {
    renderResponse({ message: "No access token available." });
    return false;
  }

  return true;
};

const ensureRefreshToken = (): boolean => {
  if (!refreshToken.trim()) {
    renderResponse({ message: "No refresh token available." });
    return false;
  }

  return true;
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return error;
};

const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";

  let data: unknown = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw data;
  }

  return data as T;
};

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const body = parseForm(registerForm);

    const result = await apiRequest<ApiResponse>("/register", {
      method: "POST",
      body: JSON.stringify(body),
    });

    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Register request failed",
      error: normalizeError(error),
    });
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const body = parseForm(loginForm);

    const result = await apiRequest<ApiResponse<LoginResponseData>>("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const firstEntry = result.data[0];

    if (firstEntry) {
      setTokens(firstEntry);
    }

    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Login request failed",
      error: normalizeError(error),
    });
  }
});

makeAdminForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!ensureAccessToken()) {
    return;
  }

  try {
    const body = parseForm(makeAdminForm);

    const result = await apiRequest<ApiResponse>("/make-admin", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Make-admin request failed",
      error: normalizeError(error),
    });
  }
});

meButton.addEventListener("click", async () => {
  if (!ensureAccessToken()) {
    return;
  }

  try {
    const result = await apiRequest<ApiResponse>("/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Me request failed",
      error: normalizeError(error),
    });
  }
});

refreshButton.addEventListener("click", async () => {
  if (!ensureRefreshToken()) {
    return;
  }

  try {
    const result = await apiRequest<ApiResponse<LoginResponseData>>(
      "/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
    );

    const firstEntry = result.data[0];

    if (firstEntry) {
      setTokens(firstEntry);
    }

    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Refresh request failed",
      error: normalizeError(error),
    });
  }
});

logoutButton.addEventListener("click", async () => {
  if (!ensureRefreshToken()) {
    return;
  }

  try {
    const result = await apiRequest<ApiResponse>("/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    clearTokens();
    renderResponse(result);
  } catch (error) {
    renderResponse({
      message: "Logout request failed",
      error: normalizeError(error),
    });
  }
});

clearTokensButton.addEventListener("click", () => {
  clearTokens();
  renderResponse({ message: "Tokens cleared locally." });
});
