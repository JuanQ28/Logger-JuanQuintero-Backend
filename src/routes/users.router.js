import { Router } from "express";
import { usersManager } from "../dao/manager-mongo/UsersManager.mongo.js";
import { compareData, generateToken, hashData } from "../utils.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router()

router.post("/signup", passport.authenticate("signup", {
    successRedirect:"/login",
    failureRedirect: "/signup",
}))

router.post("/login", async (request, response) => {
    const {email: emailUser, password} = request.body
    try {
        const user = await usersManager.findByEmail(emailUser)
        if(!user){
            return response.redirect("/login")
        }
        const isPasswordValid = compareData(password, user.password)
        if(!isPasswordValid){
            return response.status(401).json({message:"Contraseña incorrecta"})
        }
        const {name, lastName, email, role} = user
        const token = generateToken({name, lastName, email, role})
        response.cookie("token", token).redirect("/")
    } catch (error) {
        response.status(500).json({message: error.message})
    }
})

//Obtención de token a través de cookies
router.get("/cookies", passport.authenticate("jwt", {session: false}), async (request, response) => {
    try {
        const currentUser = jwt.verify(request.cookies.token, "Proyecto47315")
        console.log(currentUser)
        if(currentUser){
            return response.status(200).json({message: "Current user available", user: currentUser})
        }else{
            return response.status(404).json({message: "Current user not available"})
        }
    } catch (error) {
        response.status(500).json({message: error.message})
    }
})

//Github Strategy
router.get("/auth/github", passport.authenticate('github', 
    { scope: [ 'user:email' ] })
)

router.get("/github/callback", passport.authenticate("github", {
    successRedirect: "/",
    failureRedirect: "/login"
}))
//

//Google Strategy
router.get("/auth/google", passport.authenticate('google', 
    { scope: [ 'profile', 'email' ] })
)

router.get("/google/callback", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login"
}))
//

router.post("/restore", async (request, response) => {
    const {email, password} = request.body
    try {
        const user = await usersManager.findByEmail(email)
        if(!user){
            return response.redirect("/login")
        }
        const passwordHashed = await hashData(password)
        user.password = passwordHashed
        await user.save()
        response.redirect("/login")
    } catch (error) {
        response.status(500).json({error})
    }
})

router.get("/signout", async (request, response) => {
    try {
        response.clearCookie("token").redirect("/login")
    } catch (error) {
        response.status(500).json({error})
    }
})


export default router