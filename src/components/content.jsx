import React from 'react'
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

import { serialize } from 'react-serialize'

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import MenuBar from './menu-bar';
import Shape from "./shape"
import Line from "./line"
import Image from "./image"
import Text from "./text"

import open from "../images/new.svg"
import save from "../images/save.svg"
import undo from "../images/undo.svg"
import redo from "../images/redo.svg"
import { ContentAdd } from 'material-ui/svg-icons';

export default class Content extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            elements: [],
            boundingBox: {},
            input: false,
            click: false,
            count: 0,
            refs: {},
            open: false,
            positionX: null,
            positionY: null,
            objectW: 0,
            objectH: 0,
        }

        this.canvas = React.createRef()

        this.handleClick = this.handleClick.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseUp = this.handleMouseUp.bind(this)
        this.handleSave = this.handleSave.bind(this)
        this.handleClickInside = this.handleClickInside.bind(this)
        this.handleOpen = this.handleOpen.bind(this)
        this.handleUndo = this.handleUndo.bind(this)
        this.handleRedo = this.handleRedo.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.handleAddLogic = this.handleAddLogic.bind(this)
        this.applyLogic = this.applyLogic.bind(this)
        this.onLoad = this.onLoad.bind(this)
        this.transformation = this.transformation.bind(this)
        this.handleBoundryClick = this.handleBoundryClick.bind(this)
        this.handleLayoutUpdate = this.handleLayoutUpdate.bind(this)
        this.handleShapeChange = this.handleShapeChange.bind(this)

        this.menubarItems = [
            { name: "Open", image: open, func: this.handleOpen },
            { name: "Save", image: save, func: this.handleSave },
            { name: "Undo", image: undo, func: this.handleUndo },
            { name: "Redo", image: redo, func: this.handleRedo }
        ]

        this.item = {}
        this.history = { el: [[]], ref: [[]] }
        this.currentState = 0
        this.offsetW = "100%"
        this.offsetH = "100%"
        this.move = null
        this.selected = []
    }

    componentDidMount() {
        this.offsetX = this.canvas.current.getBoundingClientRect().left
        this.offsetY = this.canvas.current.getBoundingClientRect().top
        this.offsetW = this.canvas.current.getBoundingClientRect().width
        this.offsetH = this.canvas.current.getBoundingClientRect().height
    }
    componentDidUpdate(prevProps, prevState) {
        const { lineType, lineWidth, cornerType, strokeColor, fillColor, shadow, strong } = this.props
        if (this.props.activeItem != prevProps.activeItem && (this.props.activeItem == "Erase" || this.props.activeItem == "Copy")) {
            this.selected = []
            this.setState({ boundingBox: {} })
        }
        if (this.props.activeItem === "Move") {
            let prop = null, value = null
            if (lineType != prevProps.lineType) {
                prop = 'dashed'
                value = lineType
            }
            else if (lineWidth != prevProps.lineWidth) {
                prop = 'weight'
                value = lineWidth
            }
            else if (cornerType != prevProps.cornerType) {
                prop = 'corner'
                value = cornerType
            } else if (strokeColor != prevProps.strokeColor) {
                prop = 'stroke'
                value = strokeColor
            } else if (fillColor != prevProps.fillColor) {
                prop = 'fill'
                value = fillColor
            }
            else if (shadow != prevProps.shadow) {
                prop = 'shadow'
                value = shadow
            }
            else if (strong != prevProps.strong) {
                prop = 'strong'
                value = strong
            }
            if (prop) {
                this.selected.forEach(s => {
                    this.state.refs[s].current.updateStyle(prop, value).then(res => this.snapshot())
                })
            }
        }
    }

    handleMouseMove(e) {
        this.setState({ positionX: e.clientX - this.offsetX, positionY: e.clientY - this.offsetY })

        const scale = this.props.zoom
        if (this.resizedItem != undefined) {
            // this.state.refs[this.resizedItem].current.move(scale * e.movementX, scale * e.movementY)
            this.selected.forEach(s => this.state.refs[s].current.move(scale * e.movementX, scale * e.movementY))
        }
        if (this.isDrawing) {
            this.state.refs[this.currentItem].current.handleMoving(0, 0, scale * e.movementX, scale * e.movementY)
            this.setState({ objectW: e.clientX - this.offsetX - this.state.startX, objectH: e.clientY - this.state.startY - this.offsetY })
        }
    }
    handleBoundryClick(id) {
        this.resizedItem = id
        this.isMoving = true
        // this.setState({ startX: this.state.refs[id].state.x, startY: this.state.refd[id].state.y })
    }
    handleClickInside(id, ctrl = false) {
        if (this.props.activeItem === "Move") {
            this.setState({ boundingBox: { ...this.state.boundingBox, [id]: this.state.refs[id].current.setBoundry() } })
            this.selected = [...this.selected, id]
        }
        else if (this.props.activeItem === "Erase") {
            const { refs } = this.state
            delete refs[id]
            this.setState({ elements: this.state.elements.filter(e => e.id != id), refs }, () => this.snapshot())
        }
        else if (this.props.activeItem == "Copy") {
            const { elements, refs, count } = this.state
            const ref = React.createRef()
            const newE = React.cloneElement(elements.filter(e => e.id == id)[0].e, { ...refs[id].current.state, x: 10, y: 10, id: count, ref: ref, key: count })
            refs[count] = ref
            this.props.changeTool(null, "Move")
            this.setState({ elements: [...this.state.elements, { id: count, e: newE }], refs, count: count + 1 }, () => this.handleClickInside(count))
        }
    }

    applyLogic() {
        this.state.refs[this.logicTarget].current.handleLogic(this.logic)
        this.handleClose()
    }
    handleAddLogic(id, logic) {
        this.logic = logic
        this.logicTarget = id
        this.setState({ open: true })
    }
    handleLayoutUpdate(id, layout, w, h) {
        const { boundingBox } = this.state
        boundingBox[id] = layout
        this.setState({ boundingBox, objectW: w, objectH: h })
    }
    handleClick(e) {
        const { refs } = this.state
        const { activeItem, zoom } = this.props
        const scale = zoom
        let element = null
        this.item = {}
        this.setState({ boundingBox: {} })
        this.selected = []

        if (activeItem === "Text") {
            const ref = React.createRef()
            element = <Text x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)}
                text="" weight={this.props.lineWidth}
                stroke={this.props.strokeColor} fill={this.props.fillColor}
                ref={ref} id={this.state.count} key={this.state.count}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                addLogic={this.handleAddLogic}
                changeShape={this.handleShapeChange}
                updateLayout={this.handleLayoutUpdate} />
            if (element) {
                refs[this.state.count] = ref
                this.setState({
                    elements: [...this.state.elements, { id: this.state.count, e: element }],
                    refs,
                    count: this.state.count + 1
                })
            }
        }
    }
    handleMouseDown(e) {
        const { refs } = this.state
        const { activeItem, zoom } = this.props
        const ref = React.createRef()
        const scale = zoom
        let element = null
        this.setState({ startX: e.clientX - this.offsetX, startY: e.clientY - this.offsetY })
        if (activeItem === "Move" || activeItem === "Text" || activeItem === "Erase" || activeItem === "Copy")
            return
        if (activeItem === "Line" || activeItem === "Arrow" || activeItem === "Bridge")
            element = <Line
                points={[[scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)], [scale * (e.clientX - this.offsetX), scale * (e.clientY - this.offsetY)]]}
                arrow={activeItem == "Arrow"} stroke={this.props.strokeColor} weight={this.props.lineWidth} dashed={this.props.lineType}
                key={this.state.count}
                id={this.state.count}
                path={[]}
                shadow={this.props.shadow}
                corner={this.props.cornerType}
                ref={ref}
                addLogic={this.handleAddLogic}
                clickInside={this.handleClickInside}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                changeShape={this.handleShapeChange}
            />
        else if (activeItem === "Rectangle" || activeItem === "Circle" || activeItem === "Ellipse") {
            element = <Shape x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0} shape={activeItem} stroke={this.props.strokeColor} fill={this.props.fillColor} dashed={this.props.lineType} weight={this.props.lineWidth} earase={this.state.earase} click={this.state.click}
                key={this.state.count}
                corner={this.props.cornerType}
                shadow={this.props.shadow}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
            />
        } else if (activeItem === "Image")
            element = <Shape src={URL.createObjectURL(this.props.file[0])} x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0} shape={activeItem} key={this.state.count}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
            />

        this.isDrawing = true
        this.currentItem = this.state.count
        if (element) {
            refs[this.state.count] = ref
            this.setState({
                elements: [...this.state.elements, { id: this.state.count, e: element }],
                refs,
                count: this.state.count + 1
            })
        }
    }
    handleMouseUp(e) {
        const { activeItem } = this.props
        let element = null

        this.setState({ startX: null, startY: null })
        if (this.isDrawing || this.isResizing || this.isLining || this.isMoving) {
            this.snapshot()
        }
        this.isDrawing = false
        this.isResizing = false
        this.isMoving = false
        this.isLining = false
        this.resizedItem = null

    }
    handleKeyDown(e) {
        const scale = this.props.zoom
        if (this.selected.length === 1) {
            if (e.key === "PageUp") {
                let { elements } = this.state
                let target
                elements = elements.filter(e => { if (e.id == this.selected[0]) target = e; else return true })
                elements.push(target)
                this.setState({ elements })
            } else if (e.key === "PageDown") {
                let { elements } = this.state
                let target
                elements = elements.filter(e => { if (e.id == this.selected[0]) target = e; else return true })
                elements.splice(0, 0, target)
                this.setState({ elements })
            }
        }
        let dx = 0, dy = 0
        let dir, pos
        switch (e.key) {
            case "Up":
            case "ArrowUp":
                dy = -1
                dir = "Up"
                pos = 0
                break
            case "Down":
            case "ArrowDown":
                dy = 1
                dir = "Down"
                pos = this.offsetH
                break
            case "Right":
            case "ArrowRight":
                dx = 1
                dir = "Right"
                pos = 0
                break
            case "Left":
            case "ArrowLeft":
                dx = -1
                dir = "Left"
                pos = this.offsetW
                break
        }
        if (e.shiftKey) this.selected.forEach(s => this.state.refs[s].current.handleAlign(dir, pos))
        else this.selected.forEach(s => this.state.refs[s].current.move(scale * dx, scale * dy))
    }

    handleShapeChange() {
        // console.log('shape change')
        this.snapshot()
    }
    snapshot() {
        if (this.currentState < this.history.el.length - 1) {
            this.history.el = this.history.el.slice(0, this.currentState + 1)
            this.history.ref = this.history.ref.slice(0, this.currentState + 1)
        }
        this.history.el.push(this.state.elements.map(el => {
            let newProps = {};
            Object.keys(el.e.ref.current.state).forEach(p => {
                if (el.e.ref.current.state[p] instanceof Array) newProps[p] = JSON.parse(JSON.stringify(el.e.ref.current.state[p]))
                else newProps[p] = el.e.ref.current.state[p]
            })
            newProps['key'] = el.id
            return ({ id: el.id, e: React.cloneElement(el.e, newProps) })
        }))
        this.history.ref.push(this.state.refs)
        this.currentState++
        // console.log(this.history.el, this.state.elements.length)
    }
    handleSave() {
        var svg = this.canvas.current
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);
        //add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        //add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        //convert svg source to URI data scheme.
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        let downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', 'CanvasAsImage.svg');
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    }
    handleOpen() {
        this.refs.fileUploader.click();
    }
    transformation(node, index) {
        if (node.name === 'g' && node.attribs.element) {
            const { refs, count } = this.state
            const ref = React.createRef()
            let element = null
            refs[count] = ref
            let props = JSON.parse(node.attribs.props)
            props['id'] = count
            props['key'] = count
            props['ref'] = ref
            if (node.attribs.element === "Shape") {
                props['clickInside'] = this.handleClickInside
                element = React.createElement(Shape, props)
            } else if (node.attribs.element === "Line") {
                element = React.createElement(Line, props)
            } else if (node.attribs.element === "Text") {
                element = React.createElement(Text, props)
            }
            this.setState({ elements: [...this.state.elements, { id: this.state.count, e: element }], refs, count: this.state.count + 1 })
        }
    }
    onLoad(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        this.setState({ elements: [], refs: {}, count: 0 })

        const self = this
        reader.onload = function (e) {
            var content = reader.result;
            content = content.replace('xmlns="http://www.w3.org/2000/svg"', "");
            content = content.replace('xmlns:xlink="http://www.w3.org/1999/xlink"', "");
            content = content.replace(/^<\?xml[^>]*>/, "")
            // console.log(content)
            const canvas = ReactHtmlParser(content, { transform: self.transformation })
            // console.log(canvas)
        }
        reader.readAsText(file);
    }
    handleUndo() {
        if (this.currentState < 1) return
        this.currentState--
        // console.log('undo', this.currentState, this.history.el.map(e => e[0] && e[0].e.props.path.map(p => p.join(" ")).join(" ")),
        //     this.history.el[this.currentState][0].e.props.path.map(p => p.join(" ")).join(" "))
        this.setState({ elements: [], refs: [], boundingBox: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }
    handleRedo() {
        if (this.currentState > this.history.el.length - 2) return
        this.currentState++
        this.setState({ elements: [], refs: [], boundingBox: [] },
            () => this.setState({ elements: this.history.el[this.currentState], refs: this.history.ref[this.currentState] }))
    }

    handleClose() {
        this.setState({ open: false })
    }

    render() {
        const { elements, boundingBox, open, positionX, positionY, startX, startY, objectW, objectH } = this.state
        // console.log(boundingBox)
        return (
            <div
                style={{ flex: 1, background: '#e5f5ee', backgroundImage: "url('src/images/grid.png')", backgroundSize: "200px 200px", display: 'flex', overflow: 'auto' }}
            >
                <MenuBar items={this.menubarItems} />
                <input type="file" id="fileInput" ref="fileUploader" onChange={this.onLoad} style={{ display: "none" }} />
                <div
                    // style={{ flex: 1 }}
                    style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}
                // dangerouslySetInnerHTML={{ __html: '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><g><g><rect x="336" y="149" width="95" height="68" stroke="black" stroke-width="3" fill="transparent"/></g></g><g/><g/></svg>' }}
                >
                    <svg
                        viewBox={`0 0 ${this.props.zoom * (this.offsetW)} ${this.props.zoom * (this.offsetH)}`}
                        ref={this.canvas}
                        width={this.offsetW} height={this.offsetH}
                        style={{ display: 'block' }}
                        onClick={this.handleClick}
                        onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseMove={this.handleMouseMove}
                        onKeyDown={e => this.handleKeyDown(e)}
                        tabIndex={0}
                    >
                        <g>
                            {elements.map((e, idx) => e.e)}
                        </g>
                        <g>
                            {Object.values(boundingBox).map(b => b)}
                        </g>
                    </svg>
                    <div style={{ position: 'absolute', bottom: 0, background: 'white', height: '20px', width: '100%' }}>
                        {positionX && <span style={{ margin: '0 20px' }}>{positionX}, {positionY}px</span>}
                        {/* {this.isDrawing && <span style={{ margin: '0 20px' }}>{positionX - startX} &times; {positionY - startY} px</span>} */}
                        {(this.isMoving || this.isDrawing) && <span style={{ margin: '0 20px' }}>{objectW} &times; {objectH} px</span>}
                    </div>
                </div>
                <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={open}>
                    <DialogTitle id="simple-dialog-title">Add Logic Vaiable to Element</DialogTitle>
                    <TextField id="standard-basic" label="data variable name" onChange={e => this.logic = e.target.value} value={this.logic} style={{ margin: '10px 50px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: "10px 30px" }}>
                        <Button onClick={this.handleClose}>skip</Button>
                        <Button onClick={this.applyLogic}>Apply</Button>
                    </div>
                </Dialog>
            </div>
        )
    }
}