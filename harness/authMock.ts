// Mock do services/auth para o harness de login (sem Firebase). Formato igual ao real (Result).
export async function signIn(): Promise<{ ok: true; data: undefined }> { return { ok: true, data: undefined }; }
export async function resetPassword(): Promise<{ ok: true; data: undefined }> { return { ok: true, data: undefined }; }
export async function signUp(): Promise<{ ok: true; data: undefined }> { return { ok: true, data: undefined }; }
