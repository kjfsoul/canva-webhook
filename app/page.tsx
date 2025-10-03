export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>canva-webhook</h1>
      <p>Server is up. OAuth + webhooks live under <code>/api/canva/*</code>.</p>
      <ul>
        <li><a href="/api/canva/auth">Start Canva OAuth</a></li>
        <li><a href="/canva/return">Return page</a></li>
      </ul>
    </main>
  );
}
