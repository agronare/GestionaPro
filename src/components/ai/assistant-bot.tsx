'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, User, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { askBusinessAssistant } from '@/ai/flows/business-assistant';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function AssistantBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            if (messages.length === 0) {
                 setMessages([{ role: 'assistant', content: "¡Hola! Soy tu asistente de negocios. Puedo ayudarte a encontrar información sobre productos, clientes y más. ¿En qué puedo ayudarte?" }]);
            }
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const assistantResponse = await askBusinessAssistant(input);
            const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error asking assistant:", error);
            const errorMessage: Message = { role: 'assistant', content: "Lo siento, tuve un problema para procesar tu solicitud. Por favor, intenta de nuevo." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const initialPrompts = [
        "¿Cuál es el precio del FERT. SULFATO DE POTASIO GRANULADO SCO. 50KG.?",
        "¿Cuánto stock queda del FERT. SULFATO DE POTASIO GRANULADO SCO. 50KG.?",
        "Dime el ingrediente activo del FERT. SULFATO DE POTASIO GRANULADO SCO. 50KG.",
    ];
    
    const handlePromptClick = (prompt: string) => {
        setInput(prompt);
        // We need a slight delay to allow the input state to update before submitting.
        setTimeout(() => {
            const form = inputRef.current?.closest('form');
            if (form) {
                form.requestSubmit();
            }
        }, 50);
    }


    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed bottom-24 right-5 z-50 w-full max-w-sm"
                    >
                        <Card className="flex flex-col h-[60vh] shadow-2xl bg-background/80 backdrop-blur-lg border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="relative p-2 bg-primary/10 rounded-full">
                                        <Bot className="h-6 w-6 text-primary" />
                                        <Sparkles className="h-3 w-3 text-amber-400 absolute -top-0 -right-0" />
                                    </div>
                                    <CardTitle className="text-lg font-semibold">Asistente IA</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                                     <div className="space-y-6">
                                        {messages.map((message, index) => (
                                        <motion.div 
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}
                                        >
                                            {message.role === 'assistant' && (
                                            <Avatar className='h-8 w-8 border-2 border-primary/20'>
                                                <AvatarFallback className="bg-primary/10"><Bot className='h-5 w-5 text-primary'/></AvatarFallback>
                                            </Avatar>
                                            )}
                                            <div
                                            className={cn(
                                                "rounded-xl px-4 py-2.5 text-sm max-w-[85%] shadow-sm",
                                                message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'
                                            )}
                                            >
                                            <p className='whitespace-pre-wrap'>{message.content}</p>
                                            </div>
                                            {message.role === 'user' && (
                                                <Avatar className='h-8 w-8 border-2 border-muted'>
                                                    <AvatarFallback className='bg-muted'><User className='h-5 w-5 text-muted-foreground'/></AvatarFallback>
                                                </Avatar>
                                            )}
                                        </motion.div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex items-start gap-3">
                                                <Avatar className='h-8 w-8 border-2 border-primary/20'>
                                                    <AvatarFallback className="bg-primary/10"><Bot className='h-5 w-5 text-primary'/></AvatarFallback>
                                                </Avatar>
                                                <div className='rounded-lg px-4 py-3 bg-muted flex items-center shadow-sm'>
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            </div>
                                        )}
                                        {messages.length <= 1 && !isLoading && (
                                             <div className="p-4 text-center">
                                                <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                                                    <Bot className="h-8 w-8 text-primary" />
                                                </div>
                                                <h3 className="mt-4 text-sm font-medium text-foreground">¿Cómo puedo ayudarte?</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">Prueba una de estas sugerencias:</p>
                                                <div className="mt-6 space-y-2 text-left">
                                                    {initialPrompts.map((prompt, i) => (
                                                        <Button key={i} variant="outline" size="sm" className="w-full text-left h-auto justify-start" onClick={() => handlePromptClick(prompt)}>
                                                            <Code className="mr-2 h-3 w-3 flex-shrink-0"/>
                                                            <span className="break-words whitespace-normal">{prompt}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-4 border-t border-primary/10">
                                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                                    <Input
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Escribe tu pregunta..."
                                        disabled={isLoading}
                                        className="h-10 text-base"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-5 right-5 z-40 h-16 w-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground neon-border"
                onClick={() => setIsOpen(prev => !prev)}
            >
                {isOpen ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
            </motion.button>
        </>
    );
}