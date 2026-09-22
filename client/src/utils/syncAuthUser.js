import { authAPI } from '../services/api';

// Refreshes the cached AuthContext user (localStorage + state) through
// the EXISTING saveUser() mechanism AuthContext already exposes — does
// not modify AuthContext.jsx. Used whenever a live B2B status differs
// from the cached user.business (e.g. right after POST /apply, or when
// B2BContext notices the server disagrees with what's cached), so the
// Navbar's "Business Portal" vs "Wholesale" link catches up without
// requiring the user to log out and back in. Best-effort: never throws.
export async function syncAuthUser(saveUser) {
  try {
    const token = localStorage.getItem('nc_token');
    if (!token) return;
    const res = await authAPI.getMe();
    saveUser(res.data.user, token);
  } catch {
    // best-effort — live B2B pages read status from their own API calls,
    // not from the cached user, so a failed sync here blocks nothing
  }
}
