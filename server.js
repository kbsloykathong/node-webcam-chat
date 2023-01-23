const express = require("express");
const app = express();
const server = require("http").Server(app);
// ใช้ ไลบรารี uuid เพื่อสร้าง URL ที่ไม่ซ้ำกันแบบสุ่มสำหรับแต่ละห้อง UUID เป็นไลบรารีจาวาสคริปต์ที่ช่วยให้เราสร้างรหัสเฉพาะได้ ในแอปพลิเคชันของเรา เราจะใช้ uuid เวอร์ชัน 4 เพื่อสร้าง URL เฉพาะของเรา
const { v4: uuidv4 } = require("uuid");

// PeerJS ช่วยให้เราใช้ WebRTC ได้
const { ExpressPeerServer } = require("peer");
const opinions = {
    debug: true,
}

/**
 EJS ถูกเข้าถึงโดยค่าเริ่มต้นในไดเร็กทอรีมุมมอง ตอนนี้สร้างโฟลเดอร์ใหม่ชื่อviewsในไดเร็กทอรีของคุณ ภายใน views โฟลเดอร์นั้น ให้เพิ่มไฟล์ชื่อ room.ejs. ให้คิดว่าไฟล์ของเราroom.ejsเป็นไฟล์ HTML ในตอนนี้
 */
app.set("view engine", "ejs");
// Socket.io ช่วยให้เราสามารถสื่อสารแบบเรียลไทม์ได้
const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});

// PeerJS ช่วยให้เราใช้ WebRTC ได้
app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// ใช้ uuid library เพื่อสร้างรหัสเฉพาะแบบสุ่มสำหรับแต่ละห้อง และเราจะเปลี่ยนเส้นทางผู้ใช้ของเราไปที่ห้องนั้น
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});


// เพิ่มมุมมองสำหรับทุกห้องที่ไม่ซ้ำกัน และเราจะส่ง URL ปัจจุบันไปยังมุมมองนั้น
app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

// รหัสนี้รับฟังเหตุการณ์ "การเชื่อมต่อ" จากไคลเอนต์
io.on("connection", (socket) => {
    // ไคลเอนต์เชื่อมต่อก็จะฟังเหตุการณ์ "เข้าร่วมห้อง"
    socket.on("join-room", (roomId, userId, userName) => {
        // เข้าร่วมห้องด้วย roomId
        socket.join(roomId);
        setTimeout(() => {
            // เหตุการณ์ "เชื่อมต่อกับผู้ใช้" ด้วย userId บางอย่างหลังจาก 1 วินาที
            socket.to(roomId).broadcast.emit("user-connected", userId);
        }, 1000)
        //ฟังเหตุการณ์ "ข้อความ" และเมื่อได้รับข้อความมันส่งข้อความและชื่อผู้ใช้ไปยังไคลเอนต์ทั้งหมดในห้อง
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

// บรรทัดนี้เริ่มต้นเซิร์ฟเวอร์และฟังพอร์ตที่ระบุในตัวแปรสภาพแวดล้อม PORT หรือพอร์ต 3030 หากไม่ได้ตั้งค่าไว้
server.listen(process.env.PORT || 3030);

