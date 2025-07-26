import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
interface User {
    id: string;
    name: string;
    email: string;
    publicKey: string;
    }
    
const Users = () => {
    const [senderId, setSenderId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fetchUsers=async()=>{
        try{
            const response=await fetch("http://localhost:5000/auth/users");
            if(!response.ok) throw new Error("Failed to fetch users");
            const data=await response.json();
            setUsers(data.data);
        }catch(err: any) {
            setError(err.message);
    }
        setLoading(false);
    }
    useEffect(() => {
        localStorage.getItem("userId")
        setSenderId(localStorage.getItem("userId"));
        setLoading(true);
        fetchUsers();
    }, []);




  return (
    <div>
        <h1>Users List</h1>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <ul>
            {users.map((user:User) => (
            <Link to={`/chat/${senderId}/${user.id}`}  key={user.id}>
                {user.name} - {user.email}
            </Link >
            ))}
        </ul>
    </div>
  )
}

export default Users
