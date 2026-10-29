// Judges as rows, the event's own criteria as columns. Empty cells are hatched until a judge reports.

// Blend white toward marking blue as the score rises, so the grid reads at a glance.
function cellColors(score) {
  const s = Math.max(0, Math.min(10, Number(score) || 0));
  const t = 0.12 + (s / 10) * 0.88;
  const from = [255, 255, 255];
  const to = [31, 63, 191];
  const rgb = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return { '--cell': `rgb(${rgb.join(',')})`, '--cell-ink': s >= 5 ? '#ffffff' : '#1c2522' };
}

export default function Matrix({ criteria = [], rows = [], caption, showOverall = true }) {
  return (
    <div className="table-scroll">
      <table className="matrix">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">Judge</th>
            {criteria.map((c) => (
              <th key={c} scope="col" className="col">
                {c}
              </th>
            ))}
            {showOverall && (
              <th scope="col" className="col">
                Overall
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="row">
                {r.name}
                {r.role && <small>{r.role}</small>}
              </th>
              {criteria.map((c) => {
                const s = r.scores?.[c];
                const has = typeof s === 'number';
                return (
                  <td key={c} className={has ? 'filled' : r.pending ? 'pending' : ''} style={has ? cellColors(s) : undefined} title={r.reasons?.[c] || undefined}>
                    {has ? s : r.pending ? r.pending : ''}
                    {has && <span className="visually-hidden"> out of 10</span>}
                  </td>
                );
              })}
              {showOverall && (
                <td className={typeof r.overall === 'number' ? 'filled overall' : 'overall'} style={typeof r.overall === 'number' ? cellColors(r.overall) : undefined}>
                  {typeof r.overall === 'number' ? r.overall : ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
