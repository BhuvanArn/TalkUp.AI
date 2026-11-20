##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## Handles notifications for the TalkUp AI microservices.
##

import engine.enumMcs as enumMcs

class Notifications():
    def __init__(self):
        """
        Class constructor
        """
        pass

    def send_notification(self, service: enumMcs.MicroservicesNames, type_id: int,
            msg: str) -> None:
        """
        Send a notification to the console
        """
        type = enumMcs.NotificationTypes()

        print(f"[{type.get_type(type_id)}|{service.name}] {type.get_emoji(type_id)} {msg}", end='\n')

    def send_start_notification(self, service: enumMcs.MicroservicesNames, successful: bool)-> None:
        """
        Send a start notification to the console with the status of the service.
        """
        type = enumMcs.NotificationTypes()

        if (successful):
            print (f"[SERVICES] {type.get_emoji(0)} {service.name} started successfully!")
        else:
            print (f"[SERVICES] {type.get_emoji(2)} Failed to start {service.name}")
