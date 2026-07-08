import { redirect } from 'next/navigation'

/* ── Root Page ── */
/* Redirect to default locale */

export default function RootPage() {
  redirect('/ru')
}
