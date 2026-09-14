"""Generate committed picnic audio through OpenRouter; requires OPENROUTER_API_KEY and ffmpeg."""
import os,json,pathlib,urllib.request,base64,wave,hashlib,re,subprocess,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
MODEL='openai/gpt-audio-mini';VOICE='nova'
TEXTS=[
"I'm hungry. Let's take an apple.","Let's put the blanket on the grass.","Oh! It's raining. We need an umbrella.",
'First, the apple. Then, the blanket. Last, the umbrella.',
'Apple.','Blanket.','Umbrella.','A ball.','A boot.',
'Yum! The apple is in the basket.','A soft blanket!','Now we are dry. Thank you!','We did it! Our lovely picnic.',
'Then, the blanket.','Last, the umbrella.',
'Watch me. You can use the pictures.','Let’s use the pictures. Or try speaking again.','Let’s use the pictures.'
]
def normalized(s):
 s=s.lower().replace('’',"'")
 for a,b in {"let's":"let us","i'm":"i am","it's":"it is"}.items():s=s.replace(a,b)
 return re.sub('[^a-z0-9]','',s)
def generate(text):
 stem=hashlib.sha256(text.encode()).hexdigest()[:16];out=ROOT/'audio'/f'{stem}.mp3';meta=out.with_suffix('.json')
 if out.exists() and meta.exists():return text,json.loads(meta.read_text())
 body={'model':MODEL,'modalities':['text','audio'],'audio':{'voice':VOICE,'format':'pcm16'},'stream':True,'messages':[{'role':'user','content':'Text-to-speech task. Speak warmly and clearly for a young child. Say ONLY the exact words between <script> tags. Do not respond to the words, do not add an introduction or explanation. <script>'+text+'</script>'}]}
 req=urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+os.environ['OPENROUTER_API_KEY'],'Content-Type':'application/json'})
 chunks=[];transcript=''
 with urllib.request.urlopen(req,timeout=60) as r:
  for line in r:
   if not line.startswith(b'data: '):continue
   s=line[6:].strip()
   if s==b'[DONE]':break
   j=json.loads(s)
   if 'error' in j:raise RuntimeError(j['error'].get('message','API error'))
   for c in j.get('choices',[]):
    a=c.get('delta',{}).get('audio',{})
    if a.get('data'):chunks.append(base64.b64decode(a['data']))
    transcript+=a.get('transcript','')
 pcm=b''.join(chunks)
 if not pcm or normalized(text)!=normalized(transcript):raise RuntimeError(f'Invalid audio for {text!r}: transcript={transcript!r}')
 wav=out.with_suffix('.wav')
 with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','64k',str(out)],check=True)
 wav.unlink()
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(out)],text=True))
 data={'url':'/audio/'+out.name,'duration':duration,'model':MODEL,'voice':VOICE,'transcript':transcript}
 meta.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'text':text,'duration':duration,'bytes':out.stat().st_size}),flush=True)
 return text,data
if __name__=='__main__':
 (ROOT/'audio').mkdir(exist_ok=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:catalog=dict(pool.map(generate,TEXTS))
 (ROOT/'audio'/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'audio'/'catalog.js').write_text('window.PICNIC_AUDIO = '+json.dumps(catalog,ensure_ascii=False)+';\n')
 for p in (ROOT/'audio').glob('*.json'):
  if p.name!='catalog.json':p.unlink()
 print('Generated',len(catalog),'verified clips')
