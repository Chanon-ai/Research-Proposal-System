# IAM Docker Modes

โปรเจกต์นี้แยกการรัน Docker ออกเป็น 2 โหมด:

- `secure mode`: เปิดออก host เฉพาะ frontend Nginx ที่พอร์ต `8080`
- `dev mode`: เปิดพอร์ต `backend`, `mongo`, `redis` เพิ่มบน `127.0.0.1` เพื่อ debug จากเครื่องนักพัฒนา

## โครงสร้างไฟล์

- `docker-compose.yml`: base stack สำหรับ secure mode
- `docker-compose.override.yml`: override สำหรับ dev mode

## Secure Mode

เหมาะสำหรับการทดสอบแบบใกล้ production หรือใช้เป็นค่า default ที่ปลอดภัยกว่า

ถ้ารันจากโฟลเดอร์ `IAM`:

```powershell
docker compose -f docker-compose.yml up -d --build
```

ถ้ารันจาก root ของ workspace:

```powershell
docker compose -f .\IAM\docker-compose.yml up -d --build
```

พอร์ตที่เข้าได้จาก host:

- `http://localhost:8080` -> Nginx frontend

พอร์ตที่ไม่เปิดออก host:

- `backend:8081`
- `mongo:27017`
- `redis:6379`

## Dev Mode

เหมาะสำหรับนักพัฒนาที่ต้องยิง API ตรง, ใช้ Mongo Compass, Redis CLI/GUI, หรือ debug backend จากเครื่อง local

ถ้ารันจากโฟลเดอร์ `IAM`:

```powershell
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
```

ถ้ารันจาก root ของ workspace:

```powershell
docker compose -f .\IAM\docker-compose.yml -f .\IAM\docker-compose.override.yml up -d --build
```

พอร์ตที่เข้าได้จาก host ใน dev mode:

- `http://localhost:8080` -> frontend Nginx
- `http://127.0.0.1:8081` -> backend
- `127.0.0.1:27017` -> MongoDB
- `127.0.0.1:6379` -> Redis

## คำสั่งที่ใช้บ่อย

ดูสถานะ:

```powershell
docker compose ps
```

ดู logs:

```powershell
docker compose logs -f frontend
docker compose logs -f backend
```

ปิด stack:

```powershell
docker compose down
```

## หมายเหตุ

- frontend ใช้ Nginx ที่ build มาจาก `fontend-vue/Dockerfile`
- Nginx proxy เส้นทาง `/api` ไปยัง backend ภายใน Docker network
- ถ้าต้องการเข้าฐานข้อมูลหรือ Redis ใน `secure mode` ให้ใช้ `docker exec` เข้า container แทน