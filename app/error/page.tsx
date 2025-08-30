// /app/error/page.tsx
export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white text-center">
      <div>
        <h1 className="text-4xl font-bold">Oops! Something went wrong.</h1>
        <p className="mt-4 text-lg">We couldn't process your request. Please try again later.</p>
      </div>
    </div>
  );
}
