##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This file defines the enumerations for microservices.
##

from enum import Enum

class MicroservicesNames(Enum):
    BA = 0
    EA = 1
    STT = 2
    TTS = 3
    VA = 4

class NotificationTypes():
    def __init__(self):
        self.types = {
            0: {
                "type": "INFO",
                "emoji": "💡"
            },
            1: {
                "type": "WARNING",
                "emoji": "⚠️"
            },
            2: {
                "type": "ERROR",
                "emoji": "❗"
            }
        }
    def get_type(self, type_id: int) -> str:
        """
        Get the type of notification by its ID.
        """
        return self.types.get(type_id, {}).get("type", "UNKNOWN")

    def get_emoji(self, type_id: int) -> str:
        """
        Get the emoji for the notification type by its ID.
        """
        return self.types.get(type_id, {}).get("emoji", "❓")
