To add custom 3D worlds and assets to your application, you need to move from "procedural" geometry (placing code-generated boxes and cylinders) to "imported" assets (loading 3D models created by artists).
Here is the professional workflow for adding custom assets to a React Three Fiber project:
Step 1: Get the Assets (.glb format)
You need 3D models. The web standard is glTF (specifically binary .glb) because it is small and efficient.
Source: Download low-poly assets from sites like Itch.io, Kenney.nl, or Sketchfab.
Create: Use Blender to model your factory, then export as .glb.
Step 2: Convert to React Components (The "Secret Weapon")
Don't just load the file; turn it into a declarative React component. This allows you to easily change colors, shadows, or hide parts of the model using code.
Place your model.glb file in your public/ folder.
Run this command in your terminal:
code
Bash
npx gltfjsx public/model.glb --types
This generates a Model.tsx file.
Step 3: Use the Component
The generated file will look something like this. You can drop it straight into your <Canvas>:
code
Tsx
// Generated Model.tsx
import { useGLTF } from '@react-three/drei'

export function FactoryModel(props) {
  const { nodes, materials } = useGLTF('/model.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Building.geometry} material={materials.Concrete} />
    </group>
  )
}
Step 4: Handle Async Loading (Crucial)
3D models are large files. React will crash if you try to render them before they download unless you wrap your scene in a <Suspense>.
I will update your App.tsx to include Suspense and a standard Loading screen (Loader), so your app is ready for custom assets immediately.