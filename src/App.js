// import React, { Component } from "react";
// import "animate.css";

// class App extends Component {
//   componentDidMount() {
//     console.log(1111111111);
//   }
//   render() {
//     return (<div style={{ display: "flex" }}> < h1 style={{ width: 200 + 'px' }} className="animate__animated animate__bounce animate__infinite	infinite">wangjilin</h1>
//       < h1 style={{ width: 200 + 'px' }} className="animate__animated animate__rubberBand animate__infinite	infinite">wangjilin</h1>
//       < h1 style={{ width: 200 + 'px' }} className="animate__animated animate__swing animate__infinite	infinite">wangjilin</h1>
//       < h1 style={{ width: 200 + 'px' }} className="animate__animated animate__wobble animate__infinite	infinite">wangjilin</h1> </div >);
//   }
// }

// export default App;
import React from "react";

import './App.css';
import useDraggable from './useDraggable';

// mySelf commit
const list = [
  {
    src: 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=3942751454,1089199356&fm=26&gp=0.jpg',
    title: '图片1'
  },
  {
    src: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1604224186531&di=528125c9c6c2ab7f5dd0f4f108704408&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fblog%2F201306%2F26%2F20130626161523_zw25t.jpeg',
    title: '图片2'
  },
  {
    src: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1604224186529&di=31915ae6ab56c476bd2308e1e320c76f&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201301%2F20%2F20130120171927_KaevQ.jpeg',
    title: '图片3'
  }
];
function cls(def, ...conditions) {
  const list = [def];
  conditions.forEach(cond => {
    if (cond[0]) {
      list.push(cond[1]);
    }
  })
  console.log(list);
  return list.join(' ')
}
export default function App() {
  return (
    <div className='App'>
      <DraggableList list={list} />
    </div>
  )
}

function DraggableList({ list }) {
  const { dragList, createDropperProps, createDraggerProps } = useDraggable(list);
  return dragList.map((item, i) => {
    if (item.type === 'BAR') {
      return <Bar id={i} {...createDropperProps(i)} key={item.id} />
    } else {
      return <Draggable {...createDraggerProps(i,item.id)}>
        <Card {...item.data} />
      </Draggable>
    }
  })
}

function Draggable({ children, eventHandlers, dragging, id }) {
  console.log('dragging===id',dragging===id);
  return <div {...eventHandlers} draggable={true}
    className={cls('draggable',[dragging===id,'dragging'])}>
      {children}
      </div>
}

function Bar({id,dragging,dragOver,eventHandlers}) {
  if(id===dragging+1){
    return null;
  }
  return <div {...eventHandlers} className={cls('draggable-bar',[dragOver===id,'dragOver'])}>
    <div className='inner' style={{height:id===dragOver?'80px':'0px'}} />
  </div>
}



function Card({ src, title }) {
  return (
    <div className='card'>
      <img src={src} />
      <span>{title}</span>
    </div>
  )
}