import telethon
import os
import io
import yaml
import PIL

client = telethon.TelegramClient('hugo', os.getenv('TG_APP_ID'), os.getenv('TG_APP_HASH'))

async def main():
    with open("data/tgchannels.yaml", "r") as sourceFile:
            items = yaml.safe_load(sourceFile)
            res = []

            for item in items:
                print(item['name'])

                ch = await client.get_entity(item['name'])
                data = await client(telethon.tl.functions.channels.GetFullChannelRequest(channel=ch))

                # save image
                img_url = '/tgchannels/{}.jpg'.format(data.full_chat.id)
                img_path = 'static' + img_url

                if os.getenv('SKIP_IMAGES') == None or not os.path.exists(img_path):
                    try:
                        img = await client.download_media(data.full_chat.chat_photo, file=bytes)
                        PIL.Image.open(io.BytesIO(img)).resize((128, 128)).save(img_path)
                    except Exception as e:
                        print(e)

                res.append(item | {
                    'id': data.full_chat.id,
                    'title': data.chats[0].title,
                    'about': data.full_chat.about,
                    'imageURL': img_url,
                })

            with open("data/full/tgchannels.yaml", "w") as f:
                yaml.dump(res, f)

with client:
    client.loop.run_until_complete(main())
