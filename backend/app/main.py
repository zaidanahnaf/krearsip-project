from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, works, public, admin

app = FastAPI(title="Krearsip API", version="0.1.0")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(works.router)
app.include_router(public.router)
app.include_router(admin.router)

@app.get("/healthz")
async def health():
    return {"ok": True}
