function ModuleCard({
  id,
  title,
  description,
  points = [],
  actions = null,
  children = null,
}) {
  return (
    <article id={id} className="module-card">
      <div className="module-head">
        <h3>{title}</h3>
        {actions}
      </div>
      <p>{description}</p>
      {points.length > 0 && (
        <ul>
          {points.map((point, index) => (
            <li key={`${id}-${index}`}>{point}</li>
          ))}
        </ul>
      )}
      {children}
    </article>
  );
}

export default ModuleCard;
