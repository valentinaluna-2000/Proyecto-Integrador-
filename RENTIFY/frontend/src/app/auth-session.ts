export interface AuthSessionClient {
  auth: {
    getSession(): Promise<{ data: { session: { access_token: string } | null } }>;
    refreshSession(): Promise<{ data: { session: { access_token: string } | null }; error: unknown }>;
  };
}
export async function synchronizeAuthSession<T>(
  client: AuthSessionClient,
  loadProfile: (token: string) => Promise<T>,
  refreshToken = false,
): Promise<T | null> {
  if (refreshToken) {
    const result = await client.auth.refreshSession();
    if (result.error || !result.data.session) throw new Error('No pudimos renovar tu sesión. Intentá nuevamente.');
  }
  const session = (await client.auth.getSession()).data.session;
  return session ? loadProfile(session.access_token) : null;
}
