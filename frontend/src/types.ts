export interface ChatMessage {
   id: string;
   content: string;
   user_id: string;
   created_at: Date;
}

export interface Channel {
   name: string;
   type: string;
   id: string;
   users: Set<string>;
}
