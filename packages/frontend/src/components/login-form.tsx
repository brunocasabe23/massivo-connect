"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom" // Añadido
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { callApi } from "@/services/api" // Añadido - Asegúrate que la ruta es correcta
import { useAuth } from "@/contexts/AuthContext" // Añadido - Asegúrate que la ruta es correcta

export default function LoginForm() {
  const { toast } = useToast()
  const { login } = useAuth() // Añadido
  const navigate = useNavigate() // Añadido
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [validation, setValidation] = useState({
    email: null as null | boolean,
    password: null as null | boolean,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate on change
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setValidation((prev) => ({ ...prev, email: value ? emailRegex.test(value) : null }))
    } else if (name === "password") {
      setValidation((prev) => ({ ...prev, password: value.length >= 6 ? true : value ? false : null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset success state if resubmitting
    if (isSuccess) {
      setIsSuccess(false)
    }

    // Validate all fields before submission
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    const passwordValid = formData.password.length >= 6

    setValidation({
      email: emailValid,
      password: passwordValid,
    })

    if (!emailValid || !passwordValid) {
      toast({
        title: "Error de validación",
        description: "Por favor, verifica los campos marcados en rojo.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const data = { email: formData.email, password: formData.password }
      // Asegúrate que la ruta '/auth/login' y el método 'POST' son correctos para tu API
      const response = await callApi('/auth/login', { method: 'POST', data })

      // Log de depuración para ver qué devuelve la API
      console.log('[LoginForm] Respuesta de login:', response);
      console.log('[LoginForm] Permisos recibidos:', response.user?.permisos);

      login(response.token, response.user) // Usa el hook de AuthContext
      setIsSuccess(true)
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de nuevo!",
      })

      // Redirigir según el rol del usuario
      setTimeout(() => {
        if (response.user?.rol === 'Administrador') {
          navigate('/admin'); // Redirigir admin a /admin
        } else {
          navigate('/dashboard'); // Redirigir otros usuarios a /dashboard
        }
      }, 1000); // Pequeño retraso para mostrar el toast de éxito

    } catch (err) {
      setIsSuccess(false); // Resetea el estado de éxito en caso de error
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
        variant: "destructive",
      })
      // No es necesario desactivar isLoading aquí si hay un finally
    } finally {
      // Asegurarse de que isLoading se desactive siempre
      setIsLoading(false)
    }
  }

  const getInputClasses = (field: "email" | "password") => {
    const baseClasses = "pl-10 transition-all duration-300"
    if (validation[field] === null) return baseClasses
    return validation[field]
      ? `${baseClasses} border-green-500 focus:border-green-500 focus:ring-green-500/20`
      : `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500/20`
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            value={formData.email}
            onChange={handleChange}
            className={getInputClasses("email")}
            disabled={isLoading}
          />
          {validation.email === false && <p className="mt-1 text-xs text-red-500">Correo electrónico inválido</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className={getInputClasses("password")}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {validation.password === false && (
            <p className="mt-1 text-xs text-red-500">La contraseña debe tener al menos 6 caracteres</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300" />
          <Label htmlFor="remember" className="text-sm font-normal">
            Recordarme
          </Label>
        </div>
        <a href="#" className="text-sm text-[#005291] hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button
        type="submit"
        className={`w-full btn-animated transition-all duration-300 ${
          isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-[#005291] hover:bg-[#004277]"
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : isSuccess ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
            </motion.div>
            Sesión iniciada
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>
    </motion.form>
  )
}
