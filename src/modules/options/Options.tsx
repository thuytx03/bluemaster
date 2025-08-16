import { Toaster } from 'react-hot-toast';
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routing } from '@/modules/options/routers';
export const Options = () => {

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

export default Options
