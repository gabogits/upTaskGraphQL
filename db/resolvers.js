const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});
//crear y firma un JWT
const crearToken = (usuario, secreta, expiresIn) =>   {
 // console.log(usuario)
  const {id, email, nombre} = usuario;

  return jwt.sign({id, email, nombre}, secreta, {expiresIn})
}

const resolvers = {
    Query: {
       obtenerProyectos: async (_, {}, ctx) => {
          const proyectos = await Proyecto.find({creador: ctx.usuario.id})
          return proyectos;
       } , 
       obtenerTareas: async (_, {input}, ctx) => {
        const tareas =  await Tarea.find({creador:  ctx.usuario.id}).where('proyecto').equals(input.proyecto)
        return tareas;
      }
    },
    Mutation: {
      crearUsuario: async (_, {input})  => {
        const {email, password} = input;

        const existeUsuario = await Usuario.findOne({email});
        console.log(existeUsuario)
        if(existeUsuario) {
          throw new Error('El  usuario ya esta registrado');
        }
        try {
          //hashear password

          const salt  = await bcryptjs.genSalt(10);
          input.password = await bcryptjs.hash(password, salt);

          console.log(input);

          //Registrar nuevo usuario
            const nuevoUsuario = new Usuario(input)
            //console.log(nuevoUsuario)
            nuevoUsuario.save();
            return "Usuario creado correctamente"
        } catch (error) {
          console.log(error)
        }
      }, 
      autenticarUsuario : async (_, {input})  => {
        const {email, password} = input;

        //si el usuario existe
        const existeUsuario = await Usuario.findOne({email});
      
        if(!existeUsuario) {
          throw new Error('El  usuario no existe');
        }

        const passwordCorrecto  = await bcryptjs.compare(password, existeUsuario.password);

        console.log(passwordCorrecto)
        if(!passwordCorrecto) {
          throw new Error('Password Incorrecto');
        }
        //si el password es correcto
        return  {
          token: crearToken(existeUsuario, process.env.SECRETA, '4hr'  )
        }
      },
      nuevoProyecto : async (_, {input}, ctx)  => {
        try {
        
          const proyecto = new Proyecto(input)

          //asocial el creador
          proyecto.creador = ctx.usuario.id;

          const resultado =  await proyecto.save();
          console.log(resultado)
          return resultado;
       
        } catch (error) {
          console.log(error)
        }
      },

      actualizarProyecto: async (_, {id, input}, ctx)  => {
         //Revisar si el proyecto o no
        let proyecto = await Proyecto.findById(id);

        if(!proyecto){
          throw new Error('Proyecto no existe');
        }

        console.log(proyecto)
          // Revisar que si la persorna que quiere editarlo es el creador  
          if(proyecto.creador.toString() !== ctx.usuario.id) {
            throw new Error('No tienes las credenciales');
          }

          //guardar el proyecto
        try {
         
          proyecto  = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true})
          return proyecto;
        } catch (error) {
          console.log(error)
        }
      
      },
      eliminarProyecto: async (_, {id}, ctx)  => {
        let proyecto = await Proyecto.findById(id);

        if(!proyecto){
          throw new Error('Proyecto no existe');
        }

        console.log(proyecto)
          // Revisar que si la persorna que quiere eliminarlo es el creador  
          if(proyecto.creador.toString() !== ctx.usuario.id) {
            throw new Error('No tienes las credenciales');
          }

          //eliminarlo el proyecto
        try {
         
          proyecto  = await Proyecto.findOneAndDelete({_id: id});
          return "Proyecto eliminado";
        } catch (error) {
          console.log(error)
        }
      },

      nuevaTarea: async (_, {input}, ctx) => {
        try {
          const tarea = new Tarea(input);
          tarea.creador = ctx.usuario.id;
          const resultado = await tarea.save();
          return resultado
        } catch (error) {
            console.log(error);
        }
    },
    actualizarTarea: async (_, {id, input, estado}, ctx) => {
        // Si la tarea existe o no
      let tarea =  await Tarea.findById(id)
      if(!tarea) {
        throw new Error('Tarea no encontrada');
      }

        //si la persona que lo edita es el creador
        if(tarea.creador.toString() !== ctx.usuario.id) {
          throw new Error('No tienes las credenciales');
        }
        //asignar estao

        input.estado = estado;

      

        //giuardar y retornar la tarea
        try {
          tarea = await Tarea.findOneAndUpdate({_id : id}, input, {new: true})
          return tarea;

        } catch (error) {
            console.log(error);
        }
    },
    eliminarTarea: async (_, { id }, ctx) => {
       
            // Si la tarea existe o no
            let tarea =  await Tarea.findById(id)
            if(!tarea) {
              throw new Error('Tarea no encontrada');
            }
              //si la persona que lo edita es el creador
            if(tarea.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
          await Tarea.findOneAndDelete({_id : id});
          return "Tarea eliminada"
    }


    }
}

module.exports = resolvers;