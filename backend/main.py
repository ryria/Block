from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import cases, transactions, users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Case Management System",
    description="Investigation case management for retail and contact centre staff.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router)
app.include_router(transactions.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}
