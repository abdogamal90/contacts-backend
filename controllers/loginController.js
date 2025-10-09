import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const users = [
  { username: 'user1', password: 'user1', role:"admin" },
  { username: 'user2', password: 'user2', role:"user" },
  { username:'user3', password:'user3', role:"admin" },
];

export const login = (req,res)=>{

  try{
    const data = req.body;

    const user = users.find(u => u.username == data.username && u.password == data.password)

    if(!user){
      return res.status(401).json({error : 'please enter correct credentials'})
    }

    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json(err.message);
  }
}

