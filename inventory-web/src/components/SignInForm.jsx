import { TextField, Typography, 
          Button, IconButton, Box,
        InputAdornment } from "@mui/material"
import React, { useState, useEffect } from "react"
import {Link, useNavigate} from 'react-router-dom'
import {
  Visibility,     // Make sure this is here
  VisibilityOff   // Make sure this is here
} from "@mui/icons-material"
import useSignIn from "../hooks/User/useSignIn"
const SignInForm = () =>
{   
    // Declare state
    const [email,setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isPassShowed,setShowPassword] = useState(false)

    // Custom hooks
    const {isLoading, error, isSuccess, SignIn} = useSignIn()

    // Function
    const navigate = useNavigate()
    const HandleClickShowPass = () => setShowPassword((show)=>!show)
    const HandlePassChange = (event) =>
    {
        console.log(`Old pass: ${password}`)
        setPassword(event.target.value)
        console.log(`New pass ${password}`)
    }
    useEffect(() => {
        if (isSuccess) {
            navigate('/dashboard');
        }
    }, [isSuccess, navigate])
    useEffect(() => {
        if (error) {
            alert(`Login failed: ${error}`);
        }
    }, [error]);
    const HandleSubmit = (event) =>
    {
        event.preventDefault()
        alert('Login is happening')
        SignIn(email,password)
    }
    return (
        <Box 
        component="form"
        sx={{
            display: 'flex',
            flexDirection: 'column',     // Items arranged horizontally
            justifyContent: 'center', // Space items evenly on main axis
            alignItems: 'center',     // Vertically center items on cross axis
            border: '1px dashed grey', // To visualize the container
            p: 1, // Padding inside container
            borderRadius: '28px',
            maxWidth: 1200,
            width: '100%', // Give some height to see vertical alignment
            maxHeight: 1200,
            height: '100%'
        }}>
            <Typography variant= "h6" sx = {{mb: 7}}>
            Sign in Form
            </Typography>

        <TextField 
            label = "Email" 
            fullWidth value ={email} 
            onChange={(e)=> setEmail(e.target.value) }>
            
        </TextField>

        
            <TextField
            type={isPassShowed ? "text" : "password"}
            label="Password"
            fullWidth
            value={password} // <--- UNCOMMENT THIS!
            onChange={(e) => HandlePassChange(e)}
            InputProps={{
                endAdornment: (
                    <InputAdornment position = 'end'>
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={HandleClickShowPass}
                            edge="end" // Optional, helps with spacing if at an edge
                    >
                            {isPassShowed ? <VisibilityOff /> : <Visibility />} {/* Conditional icon */}
                        </IconButton>
                    </InputAdornment>
                )
            }}
        >
        </TextField>
        
        <Button type ="submit" label ="Submit" onClick={HandleSubmit}>
            Submit
        </Button>
        <Typography type = "text">
            {password}
        </Typography>
        <Typography>
            {email}
        </Typography>

        <Typography sx = {{mt : 2}}>
            Doesnt have an account ?
            <Link to="/dashboard">
            To dashboard
            </Link>
        </Typography>
        
        </Box>        
    )
}


export default SignInForm