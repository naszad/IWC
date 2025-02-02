describe('PUT /api/assignments/:assignmentId', () => {
    it('should return 404 if assignment not found', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, username: 'teacher1', full_name: 'Teacher One', role: 'teacher', created_at: new Date() }]
        }) // (1) Auth middleware: fetch user
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1 }] }) // (2) Auth middleware: teacher check
        .mockResolvedValueOnce({ rows: [] }) // (3) Update query returns empty (assignment not found)
        .mockResolvedValueOnce({});       // (4) Extra query (e.g. ROLLBACK/commit) if needed

      const teacherToken = jwt.sign({ id: 1, role: 'teacher', teacher_id: 1 }, process.env.JWT_SECRET);
      const res = await request(app)
        .put('/api/assignments/999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'in_progress' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Assignment not found or unauthorized');
    });
}); 