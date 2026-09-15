import { Navigate, useLocation } from 'react-router-dom';

// Sign up and sign in are the same one-tap Google flow (the backend creates the
// account on first Google sign-in), so this route renders the sign-in page.
// Keeping a second near-identical auth page meant every Google-flow change had
// to be made twice and the two pages drifted apart.
//
// The query string is preserved so callers such as `/sign-up?redirect=/cart`
// keep working after the consolidation.
export default function UserSignUpPage() {
  const { search } = useLocation();
  return <Navigate to={`/sign-in${search}`} replace />;
}
