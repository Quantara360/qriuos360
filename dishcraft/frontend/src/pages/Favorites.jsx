import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { social, imageUrl } from '../api/client.js'
import { useNotify } from '../context/NotificationContext.jsx'

export default function Favorites() {
  const notify = useNotify()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    social.favorites()
      .then(({ favorites }) => setFavorites(favorites))
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Saved · personal collection</div>
          <h1 className="page-title">Your favorites.</h1>
        </div>
        <div className="page-sub">{favorites.length} saved</div>
      </div>

      {loading ? (
        <p style={{fontFamily: 'JetBrains Mono', fontSize: 11}}>Loading…</p>
      ) : favorites.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">♡</div>
          <div className="empty-title">No favorites yet</div>
          <div className="empty-sub">Browse the menu and save dishes you love</div>
          <div style={{marginTop: 24}}>
            <Link to="/menu"><button className="btn">Browse menu</button></Link>
          </div>
        </div>
      ) : (
        <div className="menu-grid">
          {favorites.map(d => (
            <Link to={`/dish/${d.id}`} key={d.id} className="dish-card">
              <div className="dish-img">
                <img src={imageUrl(d.image_path)} alt={d.name} />
                <span className="dish-img-tag">♥ Saved</span>
              </div>
              <div className="dish-body">
                <div className="dish-hotel">{d.hotel_name || d.owner_name}</div>
                <div className="dish-name">{d.name}</div>
                <div className="dish-meta">
                  <div className="dish-price">
                    <span className="currency">$</span>{Number(d.price).toFixed(2)}
                  </div>
                  <div className="dish-rating">
                    {d.avg_rating ? <>★ <strong>{d.avg_rating}</strong></> : 'no reviews'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
