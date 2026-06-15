import { useNotify } from '../context/NotificationContext.jsx'
import { OwnerOffers } from './OwnerDashboard.jsx'

export default function OwnerOffersPage() {
  const notify = useNotify()
  return (
    <div className="page" style={{ padding: '32px 24px 64px' }}>
      <OwnerOffers notify={notify} />
    </div>
  )
}
