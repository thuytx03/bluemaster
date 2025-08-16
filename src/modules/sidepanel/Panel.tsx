import { Button } from "@/components/ui/button"
import useAuth from "../../hooks/use-auth"
import { Toaster } from 'react-hot-toast';
import { MemoryRouter } from "react-router-dom";
import { Routing } from "../options/routers";
import { TooltipProvider } from "@/components/ui/tooltip";
export const Panel = () => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Please log in to use the extension</h1>
        <p>Click the extension icon to log in.</p>
      </div>
    )
  }
  return (
    <>

      <MemoryRouter>
        <TooltipProvider>
          <Routing />
          <Toaster />
        </TooltipProvider>
      </MemoryRouter>
    </>
  )
}

export default Panel
