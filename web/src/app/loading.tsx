/**
 * Shown while a route segment streams. Deliberately quiet -- a spinner on a
 * catalogue that is almost entirely static reads as slowness that isn't there.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-16">
      <span className="sr-only">Loading</span>
      <div className="h-4 w-32 animate-pulse rounded-sm bg-bone" />
      <div className="mt-6 h-10 w-72 max-w-full animate-pulse rounded-sm bg-bone" />
      <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <div className="aspect-square w-full animate-pulse rounded-sm bg-bone" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded-sm bg-bone" />
          </li>
        ))}
      </ul>
    </div>
  );
}
