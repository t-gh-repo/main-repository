// api/register.nrz-fn.ts
export default {
  async fetch(request: Request, ctx: any) {
    // 1. Получаем JSON от App Inventor
    const body = await request.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return Response.json(
        { status: 'error', message: 'Missing fields' },
        { status: 400 }
      );
    }

    // 2. Хешируем пароль (bcrypt недоступен в Functions, используем Web Crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Сохраняем игрока через ctx.sql (база уже привязана к проекту)
    try {
      const result = await ctx.sql`
        INSERT INTO players (nickname, password_hash)
        VALUES (${nickname}, ${hash})
        RETURNING player_id
      `;

      return Response.json({
        status: 'success',
        player_id: result[0].player_id
      });
    } catch (e: any) {
      return Response.json(
        { status: 'error', message: e.message },
        { status: 500 }
      );
    }
  }
}
