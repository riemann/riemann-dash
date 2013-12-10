/**
 * Object to be appended in the priority queue.
 *
 * @class
 * @param 	mixed 	v
 * @param	integer	p
 * @author	Augusto Pascutti
 */
var QueueItem = function(v, p) {
	this.value    = v;
	this.priority = p;
};

/**
 * Priority queue class.
 *
 * @class
 * @param 	Function[optional] 	c	Compare function to be used
 * @param	integer[optional]	m	Max number of elements to hold
 * @author	Augusto Pascutti
 */
var PriorityQueue = function(c, m) { this.init(c, m) };
PriorityQueue.prototype = {
	_queue: [],
	_compare: undefined,
	_size: 0,

	/**
	 * Priority queue class constructor.
	 *
	 * @class
	 * @param 	Function[optional] 	compare_function	Compare function to be used
	 * @param	integer[optional]	maximum_size		Max number of elements to hold
	 */
	init: function(compare_function, maximum_size) {
		this._compare = compare_function || undefined;
		this._size    = maximum_size || 0 ;
		this.reset();
	},

	/**
	 * Pushes something to the priority queue.
	 *
	 * @param 	mixed 		value
	 * @param 	integer		priority
	 * @return 	void
	 */
	push: function(value, priority) {
		this._queue.push(new QueueItem(value, priority));
		this._queue.sort(this.compare());
		this._maitain();
	},


	/**
	 * Update priority of something in the queue. Will silently add it if it
	 * doesn't already exist.
	 *
	 * @param 	mixed 		value
	 * @param 	integer		priority
	 * @return 	void
	 */
	update: function(value, priority) {
		known = false;
		idx = 0;

		this._queue.forEach(function() {
			if (JSON.stringify(this._queue[idx].value) === JSON.stringify(value)) {
				this._queue[idx].priority = priority;
				known = true;
				return;
			}
			idx++;
		}, this);

		if (!known) {
			this._queue.push(new QueueItem(value, priority));
		}
		this._queue.sort(this.compare());
		this._maitain();
	},

	/**
	 * Removes the most important item and return its value. 
	 *
	 * @return mixed
	 */
	pop: function() {
		item = this._queue.shift();
		this._maitain();
		return (item) ? item.value : undefined;
	},

	/**
	 * Returns most important item value from this queue, without removing it.
	 *
	 * @return mixed
	 */
	top: function() {
		item = this._queue[0];
		return (item) ? item.value : undefined;
	},

	/**
	 * Returns most important item priority from this queue, without removing it.
	 *
	 * @return mixed
	 */
	topPriority: function() {
		item = this._queue[0];
		return (item) ? item.priority : undefined;
	},

	/**
	 * Removes the less important item and return its value.
	 *
	 * @return mixed
	 */
	shift: function() {
		item = this._queue.pop();
		this._maitain();
		return (item) ? item.value : undefined;
	},

	/**
	 * Returns the less important item value, without removing it.
	 *
	 * @return mixed
	 */
	bottom: function() {
		idx  = this.length-1;
		item = this._queue[idx];
		return (item) ? item.value : undefined;
	},

	/**
	 * Returns the less important item priority, without removing it.
	 *
	 * @return mixed
	 */
	bottomPriority: function() {
		idx  = this.length-1;
		item = this._queue[idx];
		return (item) ? item.priority : undefined;
	},

	/**
	 * Returns the ordered queue as an Array.
	 *
	 * @return Array
	 */
	getArray: function() {
	    return this._queue || new Array();
	},

	/**
	 * Resets the queue.
	 *
	 * @return void
	 */
	reset: function() {
		this._queue = [];
		this._maitain();
	},

	/**
	 * Returns the compare function.
	 * If no compare function is set, defines a default one.
	 *
	 * @return Function
	 */
	compare: function() {
		if (!this._compare) {
			this._compare = function(a,b) {
				return b.priority - a.priority;
			};
		}
		return this._compare;
	},

	/**
	 * Defines a fixed size to the queue.
	 * Zero for no limit and any other number to set it as the highest number
	 * of items allowed in this queue.
	 *
	 * @param 	integer		i
	 * @return 	void
	 */
	size: function(i) {
		this._size = i;
	},

	/**
	 * Keeps the size of the queue by removing the less important item of it and length
	 * information atribute.
     *
	 * @return void
	 */
	_maitain: function() {
	    this.length = this._queue.length;
		if ( this._size == 0 ) return;
		while (this._size < this.length) {
			this.shift();
		}
	},
};
