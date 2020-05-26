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
        this.handleDeselect = this.handleDeselect.bind(this)

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
            const corner = this.state.refs[this.resizedItem].current.getCorner()
            this.selected.forEach(s => {this.state.refs[s].current.setCorner(corner); this.state.refs[s].current.move(scale * e.movementX, scale * e.movementY)})
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
    handleDeselect(id) {
        const { boundingBox } = this.state
        delete boundingBox[id]
        const index = this.selected.indexOf(id);
        if (index > -1) {
            this.selected.splice(index, 1);
        }
        console.log(this.selected, boundingBox)
        this.setState({ boundingBox })
    }
    handleClickInside(id, ctrl = false) {
        if (this.props.activeItem === "Move") {
            console.log('click inside')
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
                deselect={this.handleDeselect}
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
                deselect={this.handleDeselect}
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
                deselect={this.handleDeselect}
            />
        } else if (activeItem === "Image")
            element = <Shape file ={this.props.file[0]} src={URL.createObjectURL(this.props.file[0])} x={scale * (e.clientX - this.offsetX)} y={scale * (e.clientY - this.offsetY)} w={0} h={0} shape={activeItem} key={this.state.count}
                clickInside={this.handleClickInside}
                id={this.state.count}
                ref={ref}
                handleBoundryClick={this.handleBoundryClick}
                updateLayout={this.handleLayoutUpdate}
                deselect={this.handleDeselect}
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
        let xs = [], ys = [], xs_ = [], ys_ = []
        this.selected.forEach(s => { const loc = this.state.refs[s].current.getLocation(); xs.push(loc.x); xs_.push(loc.x + loc.w); ys.push(loc.y); ys_.push(loc.y + loc.h) })
        let dir, pos
        switch (e.key) {
            case "Up":
            case "ArrowUp":
                dy = -1
                dir = "Up"
                pos = Math.min(...ys)
                break
            case "Down":
            case "ArrowDown":
                dy = 1
                dir = "Down"
                pos = Math.max(...ys_)
                break
            case "Right":
            case "ArrowRight":
                dx = 1
                dir = "Right"
                pos = Math.max(...xs_)
                break
            case "Left":
            case "ArrowLeft":
                dx = -1
                dir = "Left"
                pos = Math.min(...xs)
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
        const data = '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'

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
                        {/* <img src={`data:image/jpeg;base64,${data}`} /> */}
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