export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function ReportsRedirectPage() {
  redirect('/admin/reports');
}
