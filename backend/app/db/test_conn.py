import asyncio
import asyncpg

async def test():
    conn = await asyncpg.connect(
        "postgresql://postgres.zgmogpzcvjuiyykiubxx:jeskonz123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
    )
    print("Connected:", conn)
    await conn.close()

asyncio.run(test())
