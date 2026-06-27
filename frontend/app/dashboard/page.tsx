import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function DashboardRedirectPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/login')
  }
  
  const role = session.user.role
  
  if (role === 'teacher') {
    redirect('/teacher')
  } else if (role === 'admin') {
    redirect('/admin')
  } else if (role === 'account') {
    redirect('/account')
  } else {
    redirect('/student')
  }
}
