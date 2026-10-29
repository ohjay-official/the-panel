// First-load intro: the brand grid fills cell by cell, then the sheet lifts away.
// Pure CSS, so it finishes on its own even before JavaScript runs. It lives in the root layout,
// which stays mounted during in-site navigation, so it only plays on a full page load.
export default function Preloader() {
  const order = [0, 1, 2, 5, 4, 3, 6, 7, 8];
  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-inner">
        <div className="preloader-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${order.indexOf(i) * 70}ms` }} className={i === 8 ? 'blue' : i === 4 ? 'white' : ''} />
          ))}
        </div>
        <div className="preloader-word">The Panel</div>
      </div>
    </div>
  );
}
