import React from "react";

import MenuBar from "./menu-bar";

import open from "../images/new.svg"
import save from "../images/save.svg"
import undo from "../images/undo.svg"
import redo from "../images/redo.svg"

export default class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDrawing: false,
      offsetX: 0,
      offsetY: 0,
      offsetW: 0,
      offsetH: 0,
      startX: 0,
      startY: 0
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleFileBrowser = this.handleFileBrowser.bind(this)
    this.handleSave = this.handleSave.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleRedo = this.handleRedo.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleText = this.handleText.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.canvasRef = React.createRef();
    this.canvasOverlayRef = React.createRef();
    this.ctx = null;
    this.overlayCtx = null;
    this.isMoving = false;
    this.mouseDown = false;
    this.checkForMove = false;
    this.isResizing = false;
    this.corner = "";
    this.isBridging = false;
    this.inputNode = null;
    this.history = [];
    this.currentState = -1;

    this.menubarItems = [
      { name: "Open", image: open, func: this.handleOpen },
      { name: "Save", image: save, func: this.handleSave },
      { name: "Undo", image: undo, func: this.handleUndo },
      { name: "Redo", image: redo, func: this.handleRedo }
    ]
  }

  componentDidMount() {
    let canvasRef = this.canvasRef.current;
    let canvasOverlayRef = this.canvasOverlayRef.current;
    let canvasRect = canvasRef.getBoundingClientRect();

    this.ctx = canvasRef.getContext("2d");
    this.ctxOverlay = canvasOverlayRef.getContext("2d");
    this.setState({ offsetX: canvasRect.left, offsetY: canvasRect.top, offsetW: canvasRef.offsetWidth, offsetH: canvasRef.offsetHeight });
    this.history.push(canvasRef.toDataURL())
    this.currentState++;
  }

  handleMouseDown(e) {
    let ctx = this.ctx;
    let ctxOverlay = this.ctxOverlay;
    let activeItem = this.props.activeItem;

    if (this.isResizing || this.isMoving) {
      if (this.isResizing) {
        this.mouseDown = true
        if (this.objX - 3 < e.clientX - this.state.offsetX && e.clientX - this.state.offsetX < this.objX + 3 && this.objY - 3 < e.clientY - this.state.offsetY && e.clientY - this.state.offsetY < this.objY + 3) {

        } else if (this.objX + this.objW - 3 < e.clientX - this.state.offsetX && e.clientX - this.state.offsetX < this.objX + this.objW + 3 && this.objY + this.objH - 3 < e.clientY - this.state.offsetY && e.clientY - this.state.offsetY < this.objY + this.objH + 3) {
          this.corner = "button-right"
          console.log('4')
          this.isMoving = false
          ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
          this.movinObj = ctx.getImageData(this.objX, this.objY, this.objW, this.objH);
          ctx.putImageData(new ImageData(Uint8ClampedArray.from(Array(4 * this.objW * this.objH).fill(255)), this.objW, this.objH), this.objX, this.objY)
        } else {
          this.isResizing = false;
          this.mouseDown = false;
        }
        // this.isMoving = false
      }
      if (this.isMoving) {
        this.mouseDown = true;
        if (this.objX - 3 < e.clientX - this.state.offsetX && e.clientX - this.state.offsetX < this.objX + this.objW + 3 && this.objY - 3 < e.clientY - this.state.offsetY && e.clientY - this.state.offsetY < this.objY + this.objH + 3) {
          if (activeItem === "Crop") {
            this.movinObj = ctx.getImageData(this.objX, this.objY, this.objW, this.objH);
            ctxOverlay.putImageData(this.movinObj, this.objX, this.objY)
            ctx.putImageData(new ImageData(Uint8ClampedArray.from(Array(4 * this.objW * this.objH).fill(255)), this.objW, this.objH), this.objX, this.objY)
          } else if (activeItem === "Copy") {
            this.movinObj = ctx.getImageData(this.objX, this.objY, this.objW, this.objH);
            ctxOverlay.putImageData(this.movinObj, this.objX, this.objY)
            // ctx.putImageData(new ImageData(Uint8ClampedArray.from(Array(4 * this.objW * this.objH).fill(255)), this.objW, this.objH), this.objX, this.objY)
          }
          else
            this.movinObj = ctxOverlay.getImageData(this.objX, this.objY, this.objW, this.objH);
          this.startMovingX = e.clientX - this.state.offsetX;
          this.startMovingY = e.clientY - this.state.offsetY;
        } else {
          this.checkForMove = true;
          this.isMoving = false;
          this.isResizing = false;
          this.mouseDown = false;
        }
      }
      return
    }
    this.setState({ isDrawing: true });
    ctx.beginPath();
    ctx.strokeStyle = this.props.strokeColor;
    ctx.fillStyle = this.props.fillColor;
    ctx.lineWidth = this.props.lineWidth;
    ctx.setLineDash([this.props.lineType, this.props.lineWidth * this.props.lineType / 4])
    ctx.lineJoin = ctx.lineCap = "round";

    if (activeItem === "Pencil" || activeItem === "Brush" || activeItem === "Erase") {
      ctx.moveTo(
        e.clientX - this.state.offsetX,
        e.clientY - this.state.offsetY
      );
      if (activeItem === "Pencil") ctx.lineWidth = 1;
      if (activeItem === "Erase") {
        ctx.strokeStyle = 'white' // should be as background
        // ctx.lineWidth = 3;
        ctx.lineJoin = ctx.lineCap = "butt";
      }
    } else if (activeItem === "Line" || activeItem === "Bridge" || activeItem === "Arrow" || activeItem === "Rectangle" || activeItem === 'Circle') {
      ctxOverlay.strokeStyle = this.props.color;
      // ctxOverlay.lineWidth = 1;
      ctxOverlay.lineJoin = ctx.lineCap = "round";
      this.setState({
        startX: e.clientX - this.state.offsetX,
        startY: e.clientY - this.state.offsetY
      });
    } else if (activeItem === "Crop" || activeItem === "Resize" || activeItem === "Copy") {
      ctxOverlay.strokeStyle = "blue";
      ctxOverlay.lineWidth = 0.5;
      ctxOverlay.setLineDash([5, 5])
      ctxOverlay.lineJoin = ctx.lineCap = "butt";
      this.setState({
        startX: e.clientX - this.state.offsetX,
        startY: e.clientY - this.state.offsetY
      });
    }
  }

  handleMouseMove(e) {
    let ctx = this.ctx;
    let ctxOverlay = this.ctxOverlay;

    if (this.isMoving && this.mouseDown) {
      if (this.props.activeItem === "Rectangle") {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
        ctxOverlay.fillRect(this.objX + (e.clientX - this.state.offsetX - this.startMovingX), this.objY + (e.clientY - this.state.offsetY - this.startMovingY), this.objW, this.objH);
        ctxOverlay.strokeRect(this.objX + (e.clientX - this.state.offsetX - this.startMovingX), this.objY + (e.clientY - this.state.offsetY - this.startMovingY), this.objW, this.objH);
      } else if (this.props.activeItem === "Circle") {
        ctxOverlay.beginPath()
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
        ctxOverlay.ellipse(this.objX + (e.clientX - this.state.offsetX - this.startMovingX) + this.objW / 2, this.objY + (e.clientY - this.state.offsetY - this.startMovingY) + this.objH / 2, this.objW / 2, this.objH / 2, 0, 0, 2 * Math.PI);
        ctxOverlay.stroke();
        ctxOverlay.closePath()
      } else if (this.props.activeItem === "Crop" || this.props.activeItem === "Copy") {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
        ctxOverlay.putImageData(this.movinObj, this.objX + (e.clientX - this.state.offsetX - this.startMovingX), this.objY + (e.clientY - this.state.offsetY - this.startMovingY))
      }
    }
    if (this.isResizing && this.mouseDown) {
      if (this.props.activeItem === "Image") {
        return
      }
      ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
      let c = document.createElement('canvas')
      c.setAttribute("width", this.state.offsetW + "px")
      c.setAttribute("height", this.state.offsetH + "px")
      let cc = c.getContext("2d")
      cc.putImageData(this.movinObj, 0, 0)
      ctxOverlay.drawImage(c, 0, 0, this.objW, this.objH, this.objX, this.objY, e.clientX - this.state.offsetX - this.objX, e.clientY - this.state.offsetY - this.objY)
      this.drawBoundingBox(ctxOverlay, this.objX, this.objY, e.clientX - this.state.offsetX - this.objX, e.clientY - this.state.offsetY - this.objY)
    }

    if (this.state.isDrawing) {
      if (
        this.props.activeItem === "Pencil" ||
        this.props.activeItem === "Brush" ||
        this.props.activeItem === "Erase"
      ) {
        ctx.lineTo(
          e.clientX - this.state.offsetX,
          e.clientY - this.state.offsetY
        );
        ctx.stroke();
      }
      if (this.props.activeItem === "Line" || this.props.activeItem === "Bridge" || this.props.activeItem === "Arrow") {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
        ctxOverlay.beginPath();
        ctxOverlay.moveTo(this.state.startX, this.state.startY);
        ctxOverlay.lineTo(
          e.clientX - this.state.offsetX,
          e.clientY - this.state.offsetY
        );
        ctxOverlay.stroke();
        ctxOverlay.closePath();
      }
      if (this.props.activeItem === "Rectangle") {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
        let width = e.clientX - this.state.offsetX - this.state.startX;
        let height = e.clientY - this.state.offsetY - this.state.startY;
        ctxOverlay.fillRect(
          this.state.startX,
          this.state.startY,
          width,
          height
        );
        ctxOverlay.strokeRect(
          this.state.startX,
          this.state.startY,
          width,
          height
        );
      }
      if (this.props.activeItem === 'Circle') {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
        ctxOverlay.beginPath();
        let width = e.clientX - this.state.offsetX - this.state.startX;
        let height = e.clientY - this.state.offsetY - this.state.startY;
        ctxOverlay.ellipse(this.state.startX + width / 2, this.state.startY + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
        ctxOverlay.stroke();
      }
      if (this.props.activeItem === "Crop" || this.props.activeItem === "Resize" || this.props.activeItem === "Copy") {
        ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
        let width = e.clientX - this.state.offsetX - this.state.startX;
        let height = e.clientY - this.state.offsetY - this.state.startY;
        ctxOverlay.strokeRect(
          this.state.startX,
          this.state.startY,
          width,
          height
        );
      }
    }
  }

  handleMouseUp(e) {
    let ctx = this.ctx;
    let ctxOverlay = this.ctxOverlay

    if (this.isMoving) {
      let img = new Image()
      const self = this
      let endMovingX = e.clientX - this.state.offsetX;
      let endMovingY = e.clientY - this.state.offsetY;
      this.objX = this.objX + (endMovingX - this.startMovingX);
      this.objY = this.objY + (endMovingY - this.startMovingY);
      this.mouseDown = false;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.props.activeItem === "Image") {
        img.addEventListener('load', function () {
          ctxOverlay.drawImage(img, self.objX, self.objY, self.objW, self.objH);
          self.drawBoundingBox(ctxOverlay, self.objX, self.objY, self.objW, self.objH)
        }, false);
        img.src = URL.createObjectURL(this.props.file[0]); // Set source path
        return
      }
      this.ctxOverlay.putImageData(this.movinObj, this.objX, this.objY)
      return
    }
    if (this.props.activeItem === "Line") {
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      ctx.moveTo(this.state.startX, this.state.startY);
      ctx.lineTo(
        e.clientX - this.state.offsetX,
        e.clientY - this.state.offsetY
      );
      ctx.stroke();
    }
    if (this.props.activeItem === "Bridge") {
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      this.bridge(ctx, this.state.startX, this.state.startY, e.clientX - this.state.offsetX, e.clientY - this.state.offsetY)
    }
    if (this.props.activeItem === "Arrow") {
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      this.canvas_arrow(ctx, this.state.startX, this.state.startY, e.clientX - this.state.offsetX, e.clientY - this.state.offsetY)
    }

    if (this.props.activeItem === "Rectangle") {
      let width = e.clientX - this.state.offsetX - this.state.startX;
      let height = e.clientY - this.state.offsetY - this.state.startY;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.checkForMove) {
        ctx.fillRect(this.objX, this.objY, this.objW, this.objH);
        ctx.strokeRect(this.objX, this.objY, this.objW, this.objH);
        this.checkForMove = false;
      } else if (!this.isMoving) {
        this.ctxOverlay.fillRect(this.state.startX, this.state.startY, width, height);
        this.ctxOverlay.strokeRect(this.state.startX, this.state.startY, width, height);
        this.isMoving = true;
        this.objX = this.state.startX;
        this.objY = this.state.startY;
        this.objW = width;
        this.objH = height;
      }
    }
    if (this.props.activeItem === 'Circle') {
      let width = e.clientX - this.state.offsetX - this.state.startX;
      let height = e.clientY - this.state.offsetY - this.state.startY;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.checkForMove) {
        ctx.ellipse(this.objX + this.objW / 2, this.objY + this.objH / 2, this.objW / 2, this.objH / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();
        this.checkForMove = false;
      } else if (!this.isMoving) {
        this.ctxOverlay.ellipse(this.state.startX + width / 2, this.state.startY + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
        this.ctxOverlay.stroke();
        this.isMoving = true;
        this.objX = this.state.startX;
        this.objY = this.state.startY;
        this.objW = width;
        this.objH = height;
      }
    }
    if (this.props.activeItem === 'Crop') {
      let width = e.clientX - this.state.offsetX - this.state.startX;
      let height = e.clientY - this.state.offsetY - this.state.startY;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.checkForMove) {
        ctx.putImageData(this.movinObj, this.objX, this.objY)
        this.checkForMove = false;
        // this.movinObj = null
      } else if (!this.isMoving) {
        this.ctxOverlay.strokeRect(this.state.startX, this.state.startY, width, height);
        this.isMoving = true;
        this.objX = this.state.startX;
        this.objY = this.state.startY;
        this.objW = width;
        this.objH = height;
      }
    }
    if (this.props.activeItem === "Copy") {
      let width = e.clientX - this.state.offsetX - this.state.startX;
      let height = e.clientY - this.state.offsetY - this.state.startY;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.checkForMove) {
        ctx.putImageData(this.movinObj, this.objX, this.objY)
        this.checkForMove = false;
        // this.movinObj = null
      } else if (!this.isMoving) {
        this.ctxOverlay.strokeRect(this.state.startX, this.state.startY, width, height);
        this.isMoving = true;
        this.objX = this.state.startX;
        this.objY = this.state.startY;
        this.objW = width;
        this.objH = height;
      }
    }
    if (this.props.activeItem === "Resize") {
      let width = e.clientX - this.state.offsetX - this.state.startX;
      let height = e.clientY - this.state.offsetY - this.state.startY;
      this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
      if (this.isResizing) {
        if (this.corner === "button-right") {
          console.log('corner button right')
          this.ctxOverlay.putImageData(this.movinObj, 0, 0)
          ctx.drawImage(this.canvasOverlayRef.current, 0, 0, this.objW, this.objH, this.objX, this.objY, e.clientX - this.state.offsetX - this.objX, e.clientY - this.state.offsetY - this.objY)
          this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH);
          this.objW = e.clientX - this.state.offsetX - this.objX;
          this.objH = e.clientY - this.state.offsetY - this.objY;
          this.isResizing = false
          this.mouseDown = false
        }
      } else {
        this.objX = this.state.startX
        this.objY = this.state.startY
        this.objW = e.clientX - this.state.offsetX - this.state.startX
        this.objH = e.clientY - this.state.offsetY - this.state.startY
        this.isResizing = true;
      }
      this.drawBoundingBox(this.ctxOverlay, this.objX, this.objY, this.objW, this.objH)

    }
    if (this.props.activeItem === "Image") {
      let x = e.clientX - this.state.offsetX;
      let y = e.clientY - this.state.offsetY;
      var img = new Image();   // Create new img element
      const self = this
      console.log(this.checkForMove)
      if (this.checkForMove) {
        console.log('finish')
        ctxOverlay.clearRect(0, 0, self.state.offsetW, self.state.offsetH)
        img.addEventListener('load', function () {
          ctx.drawImage(img, self.objX, self.objY, self.objW, self.objH);
        }, false);
        img.src = URL.createObjectURL(this.props.file[0]); // Set source path
        this.checkForMove = false;
      } else if (this.isResizing) {
        console.log('resized')
        if (this.corner === "button-right") {
          console.log('corner button right')
          ctxOverlay.clearRect(0, 0, this.offsetW, this.offsetH)
          img.addEventListener('load', function () {
            ctxOverlay.drawImage(img, self.objX, self.objY, self.objW, self.objH);
            self.drawBoundingBox(ctxOverlay, self.objX, self.objY, self.objW, self.objH)
          }, false);
          img.src = URL.createObjectURL(this.props.file[0]); // Set source path
          this.objW = e.clientX - this.state.offsetX - this.objX;
          this.objH = e.clientY - this.state.offsetY - this.objY;
          // this.isResizing = false
          this.mouseDown = false
          this.isMoving = true
        }
      } else if (!this.isMoving && !this.isResizing) {
        img.addEventListener('load', function () {
          // execute drawImage statements here
          self.objW = img.naturalWidth
          self.objH = img.naturalHeight
          self.movinObj = img
          ctxOverlay.drawImage(img, x, y);
          self.drawBoundingBox(ctxOverlay, x, y, self.objW, self.objH)
        }, false);
        img.src = URL.createObjectURL(this.props.file[0]); // Set source path
        this.isMoving = true
        this.isResizing = true
        this.objX = x
        this.objY = y
      }
    }

    ctx.fill()
    ctx.closePath();
    this.setState({ isDrawing: false });
    this.history.splice(this.currentState + 1)
    this.history.push(this.canvasRef.current.toDataURL('image/png'))
    this.currentState++;
  }

  handleText(e) {
    this.text = e.target.value
  }
  handleBlur(x, y) {
    const self = this
    return function () {
      self.inputNode = null;
      self.forceUpdate()
      self.ctx.font = "12px Arial";
      self.ctx.fillStyle = self.props.color;
      self.ctx.textAlign = "left";
      self.ctx.direction = "rtl";
      self.ctx.fillText(self.text, x, y);
      self.text = ""
    }
  }
  handleClick(e) {
    let ctx = this.ctx;
    let ctxOverlay = this.ctxOverlay;

    ctxOverlay.beginPath()
    // ctx.beginPath()
    if (this.props.activeItem === "Text") {
      // let input = document.createElement("input", { id: "text-input" })
      this.inputNode = React.createElement('input', {
        autoFocus: true,
        onChange: this.handleText,
        onBlur: this.handleBlur(e.clientX - this.state.offsetX, e.clientY - this.state.offsetY),
        style: { position: 'absolute', left: e.clientX + 'px', top: e.clientY - 12 + 'px', border: 'None', color: this.props.color, fontSize: '12px', fontFamily: 'Comic Sans MS' }
      });
      this.forceUpdate()
    } else if (this.props.activeItem === 'Fill') {
      let x = e.clientX - this.state.offsetX;
      let y = e.clientY - this.state.offsetY;
      let initSurface = ctx.getImageData(0, 0, this.state.offsetW, this.state.offsetH)
      let color = ctx.getImageData(x, y, 1, 1)
      console.log('fill', x, y, e.clientX, this.state.offsetX)
      let filledSurface = this.fill(Array.from(initSurface.data), initSurface.width, initSurface.height, x, y, color, this.props.color)
      ctx.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
      ctx.putImageData(new ImageData(Uint8ClampedArray.from(filledSurface), initSurface.width, initSurface.height), 0, 0)
    }


    // ctx.closePath()
    ctxOverlay.closePath()
  }
  drawBoundingBox(context, x, y, w, h) {
    context.save()
    context.strokeStyle = 'blue'
    context.setLineDash([5, 5])
    context.strokeRect(x, y, w, h);
    context.setLineDash([])
    context.fillStyle = "gray"
    context.beginPath()
    context.arc(x, y, 3, 0, 2 * Math.PI)
    context.stroke()
    context.fill()
    context.closePath()
    context.beginPath()
    context.arc(x + w, y, 3, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
    context.closePath()
    context.beginPath()
    context.arc(x, y + h, 3, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
    context.closePath()
    context.beginPath()
    context.arc(x + w, y + h, 3, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
    context.closePath()
    context.restore()
  }
  bridge(context, fromx, fromy, tox, toy) {
    console.log('canvas bridge')
    var radius = 5 + this.props.lineWidth; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.moveTo(fromx + radius * Math.cos(angle), fromy + radius * Math.sin(angle));
    context.lineTo(tox - radius * Math.cos(angle), toy - radius * Math.sin(angle));
    context.arc(tox, toy, radius, angle + Math.PI, angle)
    context.stroke()
  }
  canvas_arrow(context, fromx, fromy, tox, toy) {
    var headlen = 10 + this.props.lineWidth; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox - 10 + Math.cos(angle), toy - 10 * Math.sin(angle));
    var path = new Path2D();
    path.moveTo(tox, toy);
    path.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    path.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    // path.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    path.lineTo(tox, toy)
    context.fillStyle = this.props.color
    context.fill(path)
    context.stroke()
  }

  fill(ctx, width, height, x, y, color, target) {
    let current_pixel = ctx.slice((y * width + x) * 4, (y * width + x) * 4 + 4)
    if (current_pixel.slice(0, -1).toString() != Array.from(color.data).slice(0, -1).toString()) return ctx
    ctx.splice((y * width + x) * 4, 4, parseInt(target.slice(4, -1).split(',')[0]), parseInt(target.slice(4, -1).split(',')[1]), parseInt(target.slice(4, -1).split(',')[2]), 255)
    if (x > 10 && y > 10) this.fill(ctx, width, height, x - 1, y - 1, color, target)
    if (x < 889 && y > 10) this.fill(ctx, width, height, x + 1, y - 1, color, target)
    if (x > 10 && y < 389) this.fill(ctx, width, height, x - 1, y + 1, color, target)
    if (x < 889 && y < 389) this.fill(ctx, width, height, x + 1, y + 1, color, target)
    if (x > 10) this.fill(ctx, width, height, x - 1, y, color, target)
    if (x < 889) this.fill(ctx, width, height, x + 1, y, color, target)
    if (y > 10) this.fill(ctx, width, height, x, y - 1, color, target)
    if (y < 389) this.fill(ctx, width, height, x, y + 1, color, target)
    return ctx
  }

  handleOpen() {
    console.log('handle open')
    this.refs.fileUploader.click();
  }
  handleFileBrowser(event) {
    console.log('file selected')
    const ctx = this.ctx
    const { offsetW, offsetH } = this.state
    var file = event.target.files;
    console.log(file);

    var img = new Image();   // Create new img element
    img.addEventListener('load', function () {

      var width = img.naturalWidth; // this will be 300
      var height = img.naturalHeight; // this will be 400
      ctx.drawImage(img, 0, 0, width, height, 0, 0, offsetW, offsetH);
    }, false);
    img.src = URL.createObjectURL(file[0]); // Set source path
  }
  handleSave() {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'CanvasAsImage.png');
    let dataURL = this.canvasRef.current.toDataURL('image/png');
    let url = dataURL.replace(/^data:image\/png/, 'data:application/octet-stream');
    downloadLink.setAttribute('href', url);
    downloadLink.click();
  }
  handleUndo() {
    console.log('current', this.currentState)
    if (this.currentState < 1) return
    let ctx = this.ctx;
    this.currentState--;
    console.log('undo', this.currentState, this.history.length)
    let img = new Image()
    img.src = this.history[this.currentState]
    this.ctx.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
    this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
    img.onload = function () {
      ctx.drawImage(img, 0, 0)
    };
  }
  handleRedo() {
    console.log('current', this.currentState)
    if (this.currentState == this.history.length - 1) return
    let ctx = this.ctx;
    this.currentState++;
    console.log('redo', this.currentState, this.history.length)
    let img = new Image()
    img.src = this.history[this.currentState]
    this.ctx.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
    this.ctxOverlay.clearRect(0, 0, this.state.offsetW, this.state.offsetH)
    img.onload = function () {
      ctx.drawImage(img, 0, 0)
    };
  }

  render() {
    return (
      <div className="content">
        <MenuBar
          items={this.menubarItems}
        />
        <input type="file" id="file" ref="fileUploader" accept="image/*" onChange={this.handleFileBrowser} style={{ display: "none" }} />
        <div className="canvas" id="sketchpad">
          <canvas
            id="myCanvas"
            className="canvas-actual"
            ref={this.canvasRef}
            onMouseDown={this.handleMouseDown}
            onMouseMove={this.handleMouseMove}
            onMouseUp={this.handleMouseUp}
            onMouseOver={this.handleMouseOver}
            onClick={this.handleClick}
            width="1000px"
            height="500px"
          />
          <canvas
            className="canvas-overlay"
            width={this.state.offsetW}
            height={this.state.offsetH}
            ref={this.canvasOverlayRef}
          />
          {this.inputNode}
        </div>
      </div>
    );
  }
}
