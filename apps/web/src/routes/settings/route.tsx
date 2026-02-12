import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
    Globe,
    Link as LinkIcon,
    Paintbrush,
    KeyRound,
    HardDrive,
    StepBack,
    Menu,
} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
// import { APIKeysPanel } from "./api-keys";
// import { StoragePanel } from "./-storage-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoBack } from "@/hooks/use-goback";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/settings")({
    // beforeLoad: () => {
    //     throw redirect({ to: "/settings/api-keys", replace: true })
    // },
    component: Settings,
});
const data = {
    nav: [
        { name: "API Keys", icon: KeyRound, to: "/settings/api-keys" },
        { name: "Storage", icon: HardDrive, to: "/settings/storage" },
        { name: "Appearance", icon: Paintbrush, to: "/settings/appearance" },
        { name: "Language & Region", icon: Globe, to: "/settings/language" },
        { name: "Connected Accounts", icon: LinkIcon, to: "/settings/connected-accounts" },
    ],
} as const;

function GoBackLink({ children }: { children: React.ReactNode }) {
    const { previous_url_string } = useGoBack()
    return <Link to={"/"} {...(previous_url_string ? { state: { url_string: previous_url_string } } : {})} preload="viewport">
        {children}
    </Link>
}

function Settings() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    // Derive selectedPanel from current location
    const selectedPanel = React.useMemo(() => {
        const currentNav = data.nav.find(item => location.pathname.startsWith(item.to));
        return currentNav?.name ?? "API Keys";
    }, [location.pathname]);


    return (

        <div className="w-full h-screen bg-bg-main bg-[radial-gradient(var(--bg-pattern-color)_1px,transparent_1px)] bg-size-[16px_16px]">
            <SidebarProvider className="items-start h-full">
                <Sidebar collapsible="none" className="hidden md:flex h-full border-r-2 border-black dark:border-white bg-white dark:bg-zinc-900">
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-2 p-2">
                                    <SidebarMenuItem>
                                        <GoBackLink>
                                            <SidebarMenuButton
                                                className="cursor-pointer font-mono uppercase font-bold rounded-xl"
                                            // onClick={handleBack}
                                            >
                                                <StepBack className="size-5" />
                                                <span>Back</span>
                                            </SidebarMenuButton>
                                        </GoBackLink>

                                    </SidebarMenuItem>
                                    <div className="h-px bg-black dark:bg-white my-2" />
                                    {data.nav.map((item) => (
                                        <SidebarMenuItem key={item.name}>
                                            <Link to={item.to} preload="viewport">
                                                <SidebarMenuButton
                                                    className="cursor-pointer font-mono uppercase font-bold rounded-xl"
                                                    isActive={item.name === selectedPanel}
                                                // onClick={() => handleNavClick(item)}
                                                >
                                                    <item.icon className="size-5" />
                                                    <span>{item.name}</span>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
                <main className="flex h-full flex-1 flex-col overflow-hidden">
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-black dark:border-white bg-white dark:bg-zinc-900 px-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Button */}
                            <Sheet
                                open={mobileMenuOpen}
                                onOpenChange={setMobileMenuOpen}
                            >
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        // size="icon"
                                        className="md:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-64 p-0 border-r-2 min-h-0 border-black dark:border-white bg-white dark:bg-zinc-900">
                                    <SheetHeader className="p-4 border-b-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-600">
                                        <SheetTitle className="font-mono uppercase font-black">Settings</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-full min-h-0">

                                        <nav className="flex flex-col p-2 gap-2">
                                            <GoBackLink>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setMobileMenuOpen(false);
                                                    }}
                                                    className="flex items-center justify-start gap-3 px-4 py-3 text-sm font-mono text-left uppercase font-bold w-full border-2 border-transparent hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:border-black dark:hover:border-white transition-all"
                                                >
                                                    <StepBack className="h-4 w-4" />
                                                    Back
                                                </Button>
                                            </GoBackLink>
                                            <div className="h-px bg-black dark:bg-white my-1" />
                                            {data.nav.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    to={item.to}
                                                    preload="viewport"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setMobileMenuOpen(false);
                                                        }}
                                                        className={cn(
                                                            "justify-start gap-3 px-4 py-3 text-sm font-mono text-left uppercase font-bold w-full border-2 transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:border-black dark:hover:border-white",
                                                            item.name === selectedPanel
                                                                ? "bg-yellow-300 dark:bg-yellow-600 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                                                                : "border-transparent"
                                                        )}
                                                    >
                                                        <item.icon className="h-4 w-4" />
                                                        {item.name}
                                                    </Button>
                                                </Link>
                                            ))}
                                        </nav>
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <span className="font-mono font-bold uppercase">Settings</span>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>
                                            <span className="font-mono font-bold bg-yellow-300 dark:bg-yellow-600 px-1 border-black dark:border-white border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">{selectedPanel}</span>
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex-1 overflow-hidden p-0">
                        <div className="w-full flex flex-col gap-4 h-full min-h-0">
                            <ScrollArea className="h-full p-4 py-0">
                                <div className="pt-4"></div>
                                <div className=" max-w-4xl mx-auto">
                                    <Outlet />
                                </div>


                            </ScrollArea>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </div>
    );

}

