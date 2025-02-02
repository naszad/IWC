afterAll(() => {
  // If a server is started via app.listen(...), close it here.
  if (server && typeof server.close === 'function') {
    server.close();
  }
}); 