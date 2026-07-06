from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from handlers import router


app = FastAPI(title="MobImpAI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
