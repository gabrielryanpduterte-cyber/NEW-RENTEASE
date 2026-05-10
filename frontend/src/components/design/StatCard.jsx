export default function StatCard({ icon: Icon, label, value, trend, tone = 'neutral' }) {
  return (
    <article className={`re-stat-card re-stat-card-${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {trend && <span>{trend}</span>}
      </div>
      {Icon && (
        <div className="re-stat-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
    </article>
  );
}
