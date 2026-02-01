export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to EventTicket</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your ticket booking platform is ready!
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/events"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Browse Events
          </a>
          <a
            href="/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  );
}
