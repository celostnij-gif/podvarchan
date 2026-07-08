import { redirect } from 'next/navigation'

export default function BlogRootPage() {
  redirect('/admin/blog/posts')
}
