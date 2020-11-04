import {
  ELEMENT_TEXT,
  TAG_TEXT,
  TAG_HOST,
  PLACEMENT,
  TAG_ROOT,
} from "./constant";
import { setProps } from "./utils";
/**
 * 从根节点开始渲染和调度
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM 进行增量 更新或创建，
 * render阶段 这个阶段可能比较花时间，需要我们对任务进行拆分，拆分的维度虚拟DOM,此阶段可暂停
 * render阶段成果是effect list知道哪些节点更新哪些节点删除了哪些节点增加了
 * render阶段有两个任务，根据虚拟DOM生成fiber树，收集effectlist
 * commit阶段，进行DOM更新创建阶段，此阶段不可暂停，要一气呵成
 */
let nextUnitOfWork = null;
let workInProgressRoot = null;
export function scheduleRoot(rootFiber) {
  //{tag:TAG_ROOT,stateNode:container,props:{children:[element]}} 
  workInProgressRoot = rootFiber;
  nextUnitOfWork = rootFiber;
  
}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    completeUnitOfWork(currentFiber); //没有儿子让自己完成
    if (currentFiber.sibling) {
      //看有没有弟弟
      return currentFiber.sibling; //有弟弟返回弟弟
    }
    currentFiber = currentFiber.return;
  }
}

/**
 *
 * 在完成的时候要收集有副作用的fiber，然后组成effect list
 * 每一个fiber有两个属性，firstEffect指向第一个有副作用的子fiber lastEffect指向最后一个有副作用的子fiber
 * 中间的用nextEffect做成一个单链表  firstEffect=直系儿子.nextEffect二儿子 lastEffect 最后一个儿子
 */
function completeUnitOfWork(currentFiber) {
  //第一个完成A1(TEXT)
  let returnFiber = currentFiber.return;
  if (returnFiber) {
    //把自己儿子的effect链挂到父亲身上
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    if (!!currentFiber.lastEffect) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }
    //把自己挂到父亲身上
    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      //如果自己有副作用
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}

/**
 *
 * beginWork开始
 * completeUnitOfWork该节点完成
 * 1 创建真实DOM元素
 * 2 创建子fiber
 */

function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  }
}
function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    //如果比fiber没有创建DOM节点
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}
function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    //span div
    let stateNode = document.createElement(currentFiber.type);
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}
function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps);
}
function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}

function updateHostRoot(currentFiber) {
  //先处理自己，如果是一个原生节点，创建真实DOM,2.创建子fiber
  //因为拿到的是根节点，所以直接取子节点
  let newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0; //新子节点的索引
  let prevSibling; //上一个新的子fiber

  while (newChildIndex < newChildren.length) {
    let newChild = newChildren[newChildIndex]; //取出虚拟DOM节点
    let tag;
    if (newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT; //这是一个文本节点
    } else if (typeof newChild.type === "string") {
      tag = TAG_HOST; //这是一个原生DOM节点
    }
    //beginWork创建fiber，在completeUnit
    let newFiber = {
      tag, //TAG_HOST
      type: newChild.type, //div
      props: newChild.props,
      stateNode: null, //div还没创建DOM元素
      return: currentFiber, //父fiber
      effectTag: PLACEMENT, //副作用标识 render我们要会收集副作用 增加 删除 更新
      nextEffect: null, //effect list也是一个单链表
      //effect list顺序和完成顺序是一样的，但是节点只放那些出钱的人的fiber节点，
    };
    if (newFiber) {
      if (newChildIndex === 0) {
        //如果索引为0，说明这是第一个儿子
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
    }
    newChildIndex++;
  }
}

//循环执行工作 nextUnitWork
function workLoop(deadline) {
  let shouldYield = false; //是否要让出时间片或者控制权
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); //执行完一个任务后
    shouldYield = deadline.timeRemaining() < 1; //没有时间的话就要让出控制权
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log("render阶段结束 ");
    commitRoot();
  }
  //不管有没有任务，都请求再次调度，每一帧都要执行一次workLoop
  requestIdleCallback(workLoop, { timeout: 500 });
}
function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  workInProgressRoot = null;
}
function commitWork(currentFiber) {
  if (!currentFiber) return;
  let returnFiber = currentFiber.return;
  let returnDOM = returnFiber.stateNode;
  if (currentFiber.effectTag === PLACEMENT) {
    returnDOM.appendChild(currentFiber.stateNode);
  }
  currentFiber.effectTag = null;
}

//react告诉浏览器，我现在有任务请你在闲的时候
//有一个优先级的概念 expirationTime
requestIdleCallback(workLoop, { timeout: 500 });
